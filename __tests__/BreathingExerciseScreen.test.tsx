/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { BreathingExerciseScreen } from '../src/components/BreathingExerciseScreen';

const mockOnBack = jest.fn();

test('BreathingExerciseScreen renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<BreathingExerciseScreen onBack={mockOnBack} />);
  });
});

test('BreathingExerciseScreen shows initial state', () => {
  const component = ReactTestRenderer.create(
    <BreathingExerciseScreen onBack={mockOnBack} />
  );
  
  const instance = component.root;
  
  // Check that the title is rendered
  const titleElement = instance.findByProps({ children: 'Deep Breathing' });
  expect(titleElement).toBeTruthy();
  
  // Check that the initial instruction is shown
  const instructionElement = instance.findByProps({ 
    children: 'Hold the button and breathe in...' 
  });
  expect(instructionElement).toBeTruthy();
  
  // Check that the start button is rendered
  const startButton = instance.findByProps({ 
    children: 'Start Breathing' 
  });
  expect(startButton).toBeTruthy();
  
  // Check that breath count starts at 0
  const breathCountElement = instance.findByProps({ 
    children: 'Breaths completed: 0' 
  });
  expect(breathCountElement).toBeTruthy();
}); 