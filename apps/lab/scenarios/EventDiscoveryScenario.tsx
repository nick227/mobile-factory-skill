import React, { useEffect, useReducer } from 'react';
import {
  Text,
  Stack,
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
  SegmentedControl,
  TextField,
  EmptyState,
  Dialog,
  AlertDialog,
} from '@factory/ui';
import { bookingDays, people, peoplePhotos, slots, stories, imageUrl } from '../demos/event-discovery/fixtures';
import {
  initialState, reducer, visibleEvents, filterOptions, selectedFilterIds, eventById, bookingFor,
  canConfirm, totalCents, seatsLeft, isDayOpen, slotLabel, dayLabel,
} from '../demos/event-discovery/model';
import { formatUSD, formatUSDShort } from '../demos/shared/money';

export function EventDiscoveryScenario() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [cancelRef, setCancelRef] = React.useState<string | null>(null);
  const event = eventById(s.eventId);

  // Simulated payment round-trip so the pending state is visible.
  useEffect(() => {
    if (!s.submitting) return;
    const t = setTimeout(() => dispatch({ type: 'submitted' }), 900);
    return () => clearTimeout(t);
  }, [s.submitting]);

  // 1. Discovery
  if (s.screen === 'discovery') {
    const results = visibleEvents(s);
    return (
      <Stack gap="md">
        <ScreenHeader title="Kyoto Journeys" subtitle="Curated cultural masterclasses and private heritage access" />
        <StoryRail stories={stories} onPressStory={(id) => { const st = stories.find((x) => x.id === id); if (st) dispatch({ type: 'open', eventId: st.eventId }); }} />
        <TextField label="Search experiences" placeholder="Tea, sake, Gion…" value={s.query} onChangeText={(query) => dispatch({ type: 'search', query })} autoCorrect={false} returnKeyType="search" />
        <DiscoveryFilters
          options={filterOptions(s)}
          selectedIds={selectedFilterIds(s)}
          onToggle={(id) => dispatch({ type: 'toggleCategory', id })}
          onClear={s.categories.length || s.query ? () => dispatch({ type: 'clearFilters' }) : undefined}
        />
        {results.length === 0 ? (
          <EmptyState title="No experiences match" description="Try another search or clear the filters." action={<Button label="Clear search and filters" variant="outline" onPress={() => dispatch({ type: 'clearFilters' })} />} />
        ) : (
          <EditorialMosaic
            items={results.map((e) => {
              const booked = bookingFor(s, e.id);
              return { id: e.id, title: e.title, subtitle: e.area, image: imageUrl(e.imageId, 800), badge: booked ? 'Booked' : e.badge, badgeTone: booked ? ('accent' as const) : ('neutral' as const), aspectRatio: e.aspectRatio, metadata: `${e.host} · ${e.durationLabel} · ${formatUSDShort(e.priceCents)}` };
            })}
            columns={2}
            onItemPress={(item) => dispatch({ type: 'open', eventId: item.id })}
          />
        )}
      </Stack>
    );
  }

  // 2. Detail
  if (s.screen === 'detail' && event) {
    const booking = bookingFor(s, event.id);
    const attendees = event.attendeeIds.map((id) => ({ id, name: people[id], uri: peoplePhotos[id] ? imageUrl(peoplePhotos[id], 200) : undefined }));
    return (
      <Stack gap="lg">
        <ScreenHeader title="Experience Detail" backLabel="Back" onBack={() => dispatch({ type: 'back' })} />
        <ImmersiveHero
          title={event.title}
          image={imageUrl(event.imageId, 1200)}
          subtitle={`${event.area} · ${event.durationLabel}`}
          tag={booking ? 'You are booked' : `Limited to ${event.capacity} guests`}
          metadata={event.highlight}
          primaryAction={booking ? undefined : { label: `Reserve (${formatUSDShort(event.priceCents)} per guest)`, onPress: () => dispatch({ type: 'startBooking' }) }}
        />
        <Text>{event.description}</Text>
        <Surface outlined>
          <Stack gap="sm">
            <Text variant="heading">Guest Community</Text>
            <Text muted variant="small">{attendees.length + (booking ? booking.guests : 0)} confirmed guests, hosted by {event.host}</Text>
            <PeopleStack people={booking ? [{ id: 'me', name: 'You' }, ...attendees] : attendees} maxVisible={4} size={42} />
          </Stack>
        </Surface>
        {booking ? (
          <Surface outlined>
            <Stack gap="xs">
              <Badge label="Confirmed" tone="accent" />
              <Text>{dayLabel(booking.date)} at {slotLabel(booking.slotId)} · {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'} · {formatUSD(booking.totalCents)}</Text>
              <Text muted variant="small">Reference {booking.ref}</Text>
            </Stack>
          </Surface>
        ) : null}
        <ActionDock>
          {booking ? (
            <Button label="Cancel Reservation" variant="outline" fullWidth onPress={() => setCancelRef(booking.ref)} />
          ) : (
            <Button label="Book Time Slot" fullWidth onPress={() => dispatch({ type: 'startBooking' })} />
          )}
        </ActionDock>
        <AlertDialog
          open={cancelRef !== null}
          onOpenChange={(open) => { if (!open) setCancelRef(null); }}
          title="Cancel this reservation?"
          description="Your seats will be released to other guests. You can book again while seats remain."
          destructive
          confirmLabel="Cancel Reservation"
          cancelLabel="Keep"
          onConfirm={() => { if (cancelRef) dispatch({ type: 'cancelBooking', ref: cancelRef }); setCancelRef(null); }}
        />
      </Stack>
    );
  }

  // 3. Booking
  if (s.screen === 'booking' && event) {
    const days = bookingDays.map((d) => ({ ...d, isAvailable: isDayOpen(event.id, d.date) }));
    const daySlots = slots.map((sl) => {
      const left = seatsLeft(event.id, s.date, sl.id);
      return { id: sl.id, time: sl.time, period: sl.period, available: left > 0, price: left > 0 ? `${left} left` : 'Full' };
    });
    const maxGuests = s.slotId ? Math.min(4, seatsLeft(event.id, s.date, s.slotId)) : 4;
    return (
      <Stack gap="md">
        <ScreenHeader title="Choose Date & Time" backLabel="Back" onBack={() => dispatch({ type: 'back' })} />
        <SchedulePicker
          days={days}
          slots={daySlots}
          selectedDate={s.date}
          onSelectDate={(date) => dispatch({ type: 'selectDate', date })}
          selectedSlot={s.slotId}
          onSelectSlot={(slotId) => dispatch({ type: 'selectSlot', slotId })}
          title="Available Sessions"
          description={`${event.host} hosts every session.`}
          timeZone="JST (UTC+9)"
        />
        <SegmentedControl
          label="Guests"
          value={String(s.guests)}
          onValueChange={(v) => dispatch({ type: 'setGuests', guests: Number(v) })}
          options={[1, 2, 3, 4].filter((n) => n <= maxGuests).map((n) => ({ label: `${n} ${n === 1 ? 'guest' : 'guests'}`, value: String(n) }))}
        />
        <Text muted variant="small">{s.slotId ? `${dayLabel(s.date)} at ${slotLabel(s.slotId)} · total ${formatUSD(totalCents(s))}` : 'Select a time to continue.'}</Text>
        <ActionDock>
          <Button label={s.slotId ? `Confirm Reservation · ${formatUSD(totalCents(s))}` : 'Select a time'} disabled={!canConfirm(s)} fullWidth onPress={() => dispatch({ type: 'requestConfirm' })} />
        </ActionDock>
        <Dialog
          open={s.confirming}
          onOpenChange={(open) => { if (!open) dispatch({ type: 'cancelConfirm' }); }}
          title="Complete Booking"
          description={`Reserve ${event.title} on ${dayLabel(s.date)} at ${slotLabel(s.slotId)} for ${s.guests} ${s.guests === 1 ? 'guest' : 'guests'}?`}
          dismissible={!s.submitting}
          primaryAction={{ label: s.submitting ? 'Processing…' : `Confirm & Pay ${formatUSD(totalCents(s))}`, loading: s.submitting, disabled: s.submitting, onPress: () => dispatch({ type: 'submit' }) }}
          secondaryAction={{ label: 'Cancel', onPress: () => dispatch({ type: 'cancelConfirm' }) }}
        />
      </Stack>
    );
  }

  // 4. Confirmed
  const booking = s.bookings.find((b) => b.ref === s.lastBookingRef);
  const booked = eventById(booking?.eventId ?? null);
  return (
    <Stack gap="lg">
      <ScreenHeader title="Booking Confirmed" />
      <Surface outlined>
        <Stack gap="md">
          <Badge label="Confirmed Reservation" tone="accent" />
          <Text variant="title">You're going to Kyoto!</Text>
          {booking && booked ? (
            <Stack gap="xs">
              <Text style={{ fontWeight: '700' }}>{booked.title}</Text>
              <Text>{dayLabel(booking.date)} at {slotLabel(booking.slotId)} · {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</Text>
              <Text>Paid {formatUSD(booking.totalCents)} · Reference {booking.ref}</Text>
            </Stack>
          ) : null}
        </Stack>
      </Surface>
      <ActionDock>
        <Stack gap="sm">
          <Button label="View Reservation" variant="outline" fullWidth onPress={() => booking && dispatch({ type: 'open', eventId: booking.eventId })} />
          <Button label="Explore More Experiences" variant="ghost" fullWidth onPress={() => dispatch({ type: 'restart' })} />
        </Stack>
      </ActionDock>
    </Stack>
  );
}
