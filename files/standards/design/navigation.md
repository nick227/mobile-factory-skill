# Navigation and gestures

- Peer destinations: native tabs only if the app truly has persistent peer areas.
- Collection → item: push. Editing: push focused editor. Save: return to detail.
- Simple contextual choice: inline or native sheet. Destructive action: explicit confirmation.
- Horizontal swipe may page peers, but must offer Previous/Next controls and not hijack vertical scroll.
- Platform back must work. Preserve collection scroll, query, and selection in appropriate owning route state.
- Prefer Expo Router and native presentation; no proprietary router or animation framework.
