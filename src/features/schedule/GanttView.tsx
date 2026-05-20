import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import dataService from '../../services/dataService';
import { COLORS } from '../../constants/Theme';

interface GanttViewProps {
  onEventSelect: (eventId: string) => void;
  onVenueSelect: (venueId: string) => void;
}

function useHtmlContent() {
  const events = dataService.getEvents();
  const venues = dataService.getVenues();

  return useMemo(() => {
    const venueIdsWithEvents = new Set(events.map((e) => e.venueId));
    const filteredVenues = venues.filter((v) => venueIdsWithEvents.has(v.id));

    const groups = filteredVenues.map((v) => ({
      id: v.id,
      content: v.name,
    }));

    const items = events.map((e) => ({
      id: e.id,
      group: e.venueId,
      start: e.startTime,
      end: e.endTime,
      content: e.title,
      className: e.category?.toLowerCase().replace(/\s+/g, '-') || 'default',
    }));

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css" />
  <script type="text/javascript" src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
  <style type="text/css">
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: ${COLORS.background};
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
      color: ${COLORS.textPrimary};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #visualization {
      width: 100%;
      background-color: ${COLORS.background};
    }
    .vis-timeline { border: none; background-color: ${COLORS.background}; }
    .vis-panel { border-color: #333; }
    .vis-panel.vis-center { touch-action: none; }
    .vis-panel.vis-bottom, .vis-panel.vis-center, .vis-panel.vis-left, .vis-panel.vis-right, .vis-panel.vis-top { border-color: #333; }
    .vis-text { color: ${COLORS.textSecondary}; }
    .vis-time-axis .vis-grid.vis-vertical { border-color: #222; }
    .vis-time-axis .vis-grid.vis-minor { border-color: #222; }
    .vis-labelset .vis-label { background-color: ${COLORS.background}; color: ${COLORS.textPrimary}; border-bottom: 1px solid #333; cursor: pointer; }
    @media (max-width: 600px) {
      .vis-labelset .vis-label { font-size: 11px; padding: 0 4px !important; }
      .vis-labelset .vis-inner { max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .vis-panel.vis-left { min-width: 65px !important; }
    }
    .vis-item { border-color: rgba(0,0,0,0.2); color: white; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .vis-item.afterparty { background-color: ${COLORS.afterparty}; border-color: ${COLORS.afterparty}; }
    .vis-item.day-party { background-color: ${COLORS.dayParty}; border-color: ${COLORS.dayParty}; }
    .vis-item.sunrise { background-color: ${COLORS.sunrise}; border-color: ${COLORS.sunrise}; }
    .vis-item.festival { background-color: ${COLORS.festival}; border-color: ${COLORS.festival}; }
    .vis-item.default { background-color: #444; border-color: #444; }
    .vis-item.vis-selected { border-color: white; box-shadow: 0 0 8px white; z-index: 100; }
  </style>
</head>
<body>
  <div id="visualization"></div>
  <script type="text/javascript">
    var groups = new vis.DataSet(${JSON.stringify(groups)});
    // Truncate long names so the label panel stays narrow on mobile
    var groupsData = groups.get().map(function(g) {
      var short = g.content;
      if (short.length > 13) short = short.substring(0, 12) + '…';
      return { id: g.id, content: short, title: g.content };
    });
    groups.clear();
    groups.add(groupsData);
    var items = new vis.DataSet(${JSON.stringify(items)});
    var container = document.getElementById('visualization');
    var options = {
      start: '2026-05-21T12:00:00',
      end: '2026-05-26T12:00:00',
      min: '2026-05-21T00:00:00',
      max: '2026-05-27T12:00:00',
      zoomMin: 1000 * 60 * 60 * 4,
      zoomMax: 1000 * 60 * 60 * 24 * 7,
      editable: false,
      margin: { item: 10, axis: 5 },
      orientation: 'top',
      stack: true,
      showCurrentTime: false,
      groupOrder: 'content'
    };
    var timeline = new vis.Timeline(container, items, groups, options);
    function updateHeight() {
      var rowH = window.innerWidth <= 600 ? 42 : 50;
      var h = Math.max(groups.get().length * rowH + 60, window.innerHeight);
      container.style.height = h + 'px';
    }
    updateHeight();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        updateHeight();
        timeline.redraw();
      }, 150);
    });
    window.addEventListener('orientationchange', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        updateHeight();
        timeline.redraw();
      }, 300);
    });
    timeline.on('select', function (properties) {
      if (properties.items && properties.items.length > 0) {
        window.ReactNativeWebView.postMessage(properties.items[0]);
      }
    });
    // Venue label click: walk up from target to find a .vis-label, then map to group
    function findLabel(el) {
      while (el) {
        if (el.classList && el.classList.contains('vis-label')) return el;
        el = el.parentElement;
      }
      return null;
    }
    document.addEventListener('click', function (e) {
      var label = findLabel(e.target);
      if (!label) return;
      var children = label.parentElement ? label.parentElement.children : [];
      var idx = -1;
      for (var i = 0; i < children.length; i++) {
        if (children[i] === label) { idx = i; break; }
      }
      if (idx < 0) return;
      var data = groups.get()[idx];
      if (data) {
        e.stopPropagation();
        window.ReactNativeWebView.postMessage('venue:' + data.id);
      }
    });
  </script>
</body>
</html>
    `;
  }, [events, venues]);
}

const WebGantt: React.FC<{ html: string; onEventSelect: (id: string) => void; onVenueSelect: (id: string) => void }> = ({ html, onEventSelect, onVenueSelect }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onEventSelectRef = useRef(onEventSelect);
  const onVenueSelectRef = useRef(onVenueSelect);
  onEventSelectRef.current = onEventSelect;
  onVenueSelectRef.current = onVenueSelect;

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    // Bridge ReactNativeWebView.postMessage to the React callback
    (iframe.contentWindow as any).ReactNativeWebView = {
      postMessage: (id: string) => {
        if (typeof id === 'string' && id.startsWith('venue:')) {
          onVenueSelectRef.current(id.slice(6));
        } else {
          onEventSelectRef.current(id);
        }
      },
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      onLoad={handleLoad}
      style={{ flex: 1, border: 'none', backgroundColor: COLORS.background }}
      title="Gantt Chart"
    />
  );
};

const GanttView: React.FC<GanttViewProps> = ({ onEventSelect, onVenueSelect }) => {
  const htmlContent = useHtmlContent();

  const handleMessage = (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    if (!data) return;
    if (typeof data === 'string' && data.startsWith('venue:')) {
      onVenueSelect(data.slice(6));
    } else {
      onEventSelect(data);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <WebGantt html={htmlContent} onEventSelect={onEventSelect} onVenueSelect={onVenueSelect} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        scrollEnabled={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.afterparty} />
          </View>
        )}
        startInLoadingState={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GanttView;
