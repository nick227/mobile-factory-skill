
import React, { useRef, useState } from 'react';
import {
  ScrollView,
  View,
  useWindowDimensions,
  type ScrollViewInstance,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Text } from '../primitives/Text';
import { Button } from '../controls/Button';

export interface SwipePagerProps {
  items: readonly { id: string; content: React.ReactNode }[];
  label?: string;
}

export function SwipePager({ items, label = 'Pages' }: SwipePagerProps) {
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);

  const count = items.length;

  const go = (n: number) => {
    const next = Math.max(0, Math.min(count - 1, n));
    setIndex(next);
    ref.current?.scrollTo({ x: next * width, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(
      Math.max(
        0,
        Math.min(count - 1, Math.round(e.nativeEvent.contentOffset.x / width))
      )
    );
  };

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        accessibilityLabel={label}
      >
        {items.map(item => (
          <View key={item.id} style={{ width }}>
            {item.content}
          </View>
        ))}
      </ScrollView>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
      }}>
        <Button label="Previous" variant="ghost" disabled={index <= 0} onPress={() => go(index - 1)} />
        <Text variant="small">{count ? index + 1 : 0} / {count}</Text>
        <Button label="Next" variant="ghost" disabled={index >= count - 1} onPress={() => go(index + 1)} />
      </View>
    </View>
  );
}
