/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { MoodTrackingScreen } from '../src/components/MoodTrackingScreen';

const mockOnBack = jest.fn();

test('MoodTrackingScreen renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<MoodTrackingScreen onBack={mockOnBack} />);
  });
});

test('MoodTrackingScreen shows interrupted app when provided', () => {
  const component = ReactTestRenderer.create(
    <MoodTrackingScreen onBack={mockOnBack} interruptedApp="Instagram" />
  );
  
  const instance = component.root;
  
  // Check that the title is rendered
  const titleElement = instance.findByProps({ children: 'Track Your Mood' });
  expect(titleElement).toBeTruthy();
  
  // Check that the interrupted app is shown
  const appElement = instance.findByProps({ children: 'You were about to open: Instagram' });
  expect(appElement).toBeTruthy();
});

test('MoodTrackingScreen shows all mood options', () => {
  const component = ReactTestRenderer.create(
    <MoodTrackingScreen onBack={mockOnBack} />
  );
  
  const instance = component.root;
  
  // Check that mood options are rendered
  const moodOptions = ['Happy', 'Sad', 'Content', 'Bored', 'Anxious', 'Neutral'];
  moodOptions.forEach(mood => {
    const moodElement = instance.findByProps({ children: mood });
    expect(moodElement).toBeTruthy();
  });
}); 