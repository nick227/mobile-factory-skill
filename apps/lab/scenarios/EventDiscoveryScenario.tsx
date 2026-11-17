import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {
  Text,
  Stack,
  Row,
  Surface,
  Button,
  Badge,
  ScreenHeader,
  ActionDock,
  StoryRail,
  DiscoveryFilters,
  EditorialMosaic,
  ImmersiveHero,
  PeopleStack,
  SchedulePicker,
  Dialog,
  useTheme,
  tokens,
} from '@factory/ui';

type EventScreenState = 'discovery' | 'detail' | 'booking' | 'confirmed';

export function EventDiscoveryScenario() {
  const { colors } = useTheme();
  const [state, setState] = useState<EventScreenState>('discovery');
  const [selectedFilter, setSelectedFilter] = useState<string[]>(['all']);
  const [selectedEventId, setSelectedEventId] = useState<string>('e1');
  const [selectedDate, setSelectedDate] = useState('2026-11-20');
  const [selectedSlot, setSelectedSlot] = useState<string | null>('slot-morning');
  const [dialogOpen, setDialogOpen] = useState(false);

  const stories = [
    { id: 's1', name: 'Kyoto Tea', avatarUri: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80', isLive: true },
    { id: 's2', name: 'Bamboo Path', avatarUri: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80', hasUnread: true },
    { id: 's3', name: 'Zen Garden', avatarUri: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80', hasUnread: true },
    { id: 's4', name: 'Kinkaku-ji', avatarUri: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=300&q=80', hasUnread: false },
    { id: 's5', name: 'Gion Walk', avatarUri: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=300&q=80', hasUnread: false },
  ];

  const filterOptions = [
    { id: 'all', label: 'All Experiences', count: 24 },
    { id: 'temples', label: 'Heritage Temples', count: 8 },
    { id: 'crafts', label: 'Artisan Crafts', count: 11 },
    { id: 'culinary', label: 'Kaiseki Dining', count: 5 },
  ];

  const mosaicItems = [
    {
      id: 'e1',
      title: 'Urasenke Tea Ceremony & Zen Garden',
      subtitle: 'Central Kyoto',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
      badge: 'Heritage',
      badgeTone: 'accent' as const,
      aspectRatio: 3 / 4,
      metadata: 'Master Soshitsu Sen · 2 hrs',
    },
    {
      id: 'e2',
      title: 'Bamboo Forest Dawn Walking Tour',
      subtitle: 'Arashiyama',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      badge: 'Popular',
      badgeTone: 'neutral' as const,
      aspectRatio: 1,
      metadata: 'Early sunrise access',
    },
    {
      id: 'e3',
      title: 'Traditional Woodblock Printing Workshop',
      subtitle: 'Higashiyama',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      aspectRatio: 4 / 3,
      metadata: 'Take home hand-pressed print',
    },
    {
      id: 'e4',
      title: 'Fushimi Sake Brewery & Tasting',
      subtitle: 'Fushimi Ward',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      aspectRatio: 3 / 4,
      metadata: 'Historic cellar tour',
    },
  ];

  const attendees = [
    { id: 'a1', name: 'Yuki Tanaka', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
    { id: 'a2', name: 'Clara Oswald', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80' },
    { id: 'a3', name: 'Liam Davies', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
    { id: 'a4', name: 'Sora Park', uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' },
    { id: 'a5', name: 'Marc Dupont', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
  ];

  const bookingDays = [
    { date: '2026-11-20', dayName: 'Fri', dayNumber: 20, monthName: 'Nov' },
    { date: '2026-11-21', dayName: 'Sat', dayNumber: 21, monthName: 'Nov' },
    { date: '2026-11-22', dayName: 'Sun', dayNumber: 22, monthName: 'Nov', isAvailable: false },
    { date: '2026-11-23', dayName: 'Mon', dayNumber: 23, monthName: 'Nov' },
  ];

  const bookingSlots = [
    { id: 'slot-morning', time: '10:00 AM', period: 'morning' as const, available: true, price: '$75' },
    { id: 'slot-midday', time: '01:30 PM', period: 'afternoon' as const, available: true, price: '$75' },
    { id: 'slot-evening', time: '04:30 PM', period: 'afternoon' as const, available: false, price: '$85' },
  ];

  // 1. Discovery State
  if (state === 'discovery') {
    return (
      <Stack gap="md">
        <ScreenHeader
          title="Kyoto Journeys"
          subtitle="Curated cultural masterclasses and private heritage access"
        />
        <StoryRail
          stories={stories}
          onPressStory={(id) => console.log('Story opened', id)}
        />
        <DiscoveryFilters
          options={filterOptions}
          selectedIds={selectedFilter}
          onToggle={(id) =>
            setSelectedFilter((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onClear={() => setSelectedFilter(['all'])}
        />
        <EditorialMosaic
          items={mosaicItems}
          columns={2}
          onItemPress={(item) => {
            setSelectedEventId(item.id);
            setState('detail');
          }}
        />
      </Stack>
    );
  }

  // 2. Detail State
  if (state === 'detail') {
    return (
      <Stack gap="lg">
        <ScreenHeader
          title="Experience Detail"
          backLabel="Back"
          onBack={() => setState('discovery')}
        />
        <ImmersiveHero
          title="Urasenke Private Tea Masterclass"
          subtitle="Historic 16th century sukiya tea pavilion"
          image="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80"
          tag="Limited to 6 guests"
          primaryAction={{
            label: 'Reserve Session ($75)',
            onPress: () => setState('booking'),
          }}
          metadata="Includes hand-glazed matcha bowl to keep"
        />

        <Surface outlined>
          <Stack gap="sm">
            <Text variant="heading">Guest Community</Text>
            <Text muted variant="small">
              5 confirmed cultural fellows attending this week:
            </Text>
            <PeopleStack people={attendees} maxVisible={4} size={42} />
          </Stack>
        </Surface>

        <ActionDock>
          <Button
            label="Book Time Slot"
            fullWidth
            onPress={() => setState('booking')}
          />
        </ActionDock>
      </Stack>
    );
  }

  // 3. Booking State
  if (state === 'booking') {
    return (
      <Stack gap="md">
        <ScreenHeader
          title="Choose Date & Time"
          backLabel="Back"
          onBack={() => setState('detail')}
        />
        <SchedulePicker
          days={bookingDays}
          slots={bookingSlots}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          title="Available Sessions"
          description="Master Soshitsu personally conducts all sessions."
          timeZone="JST (UTC+9)"
        />

        <ActionDock>
          <Button
            label="Confirm Reservation"
            disabled={!selectedSlot}
            fullWidth
            onPress={() => setDialogOpen(true)}
          />
        </ActionDock>

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Complete Booking"
          description={`Reserve Urasenke Tea Ceremony on ${selectedDate} at ${
            bookingSlots.find((s) => s.id === selectedSlot)?.time ?? ''
          }?`}
          primaryAction={{
            label: 'Confirm & Charge ($75)',
            onPress: () => {
              setDialogOpen(false);
              setState('confirmed');
            },
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: () => setDialogOpen(false),
          }}
        />
      </Stack>
    );
  }

  // 4. Confirmed State
  return (
    <Stack gap="lg">
      <ScreenHeader title="Booking Confirmed" />
      <Surface outlined>
        <Stack gap="md">
          <Badge label="Confirmed Reservation" tone="accent" />
          <Text variant="title">You're going to Kyoto!</Text>
          <Text>
            Your slot for{' '}
            <Text style={{ fontWeight: '700' }}>
              Urasenke Tea Ceremony ({selectedDate})
            </Text>{' '}
            has been secured. A calendar invite and pavilion access directions have
            been dispatched.
          </Text>
        </Stack>
      </Surface>
      <ActionDock>
        <Button
          label="Explore More Experiences"
          variant="outline"
          fullWidth
          onPress={() => setState('discovery')}
        />
      </ActionDock>
    </Stack>
  );
}
