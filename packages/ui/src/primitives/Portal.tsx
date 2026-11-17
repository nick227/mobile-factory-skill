import React, { createContext, useContext, useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

interface PortalEntry {
  hostName: string;
  node: React.ReactNode;
}

class PortalManager {
  private portals = new Map<string, PortalEntry>();
  private listeners = new Set<() => void>();
  private version = 0;

  getVersion() {
    return this.version;
  }

  mount(id: string, hostName: string, node: React.ReactNode) {
    this.portals.set(id, { hostName, node });
    this.version++;
    this.notify();
  }

  unmount(id: string) {
    if (this.portals.has(id)) {
      this.portals.delete(id);
      this.version++;
      this.notify();
    }
  }

  getNodes(hostName: string): { id: string; node: React.ReactNode }[] {
    const list: { id: string; node: React.ReactNode }[] = [];
    this.portals.forEach((val, id) => {
      if (val.hostName === hostName) {
        list.push({ id, node: val.node });
      }
    });
    return list;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

const PortalContext = createContext<PortalManager | null>(null);

let nextPortalId = 0;

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const managerRef = useRef<PortalManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new PortalManager();
  }

  return (
    <PortalContext.Provider value={managerRef.current}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  return useContext(PortalContext);
}

export interface PortalHostProps {
  name?: string;
  style?: ViewStyle;
}

export function PortalHost({ name = 'root', style }: PortalHostProps) {
  const manager = useContext(PortalContext);

  useSyncExternalStore(
    (callback) => (manager ? manager.subscribe(callback) : () => {}),
    () => (manager ? manager.getVersion() : 0)
  );

  if (!manager) return null;

  const nodes = manager.getNodes(name);
  if (nodes.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 1000 }, style]}
    >
      {nodes.map(({ id, node }) => (
        <React.Fragment key={id}>{node}</React.Fragment>
      ))}
    </View>
  );
}

export interface PortalProps {
  children: React.ReactNode;
  hostName?: string;
}

export function Portal({ children, hostName = 'root' }: PortalProps) {
  const manager = useContext(PortalContext);
  const [id] = useState(() => `portal-${++nextPortalId}`);

  useEffect(() => {
    if (manager) {
      manager.mount(id, hostName, children);
    }
  }, [manager, id, hostName, children]);

  useEffect(() => {
    return () => {
      if (manager) {
        manager.unmount(id);
      }
    };
  }, [manager, id]);

  if (!manager) {
    return <>{children}</>;
  }

  return null;
}
