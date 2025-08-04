/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { IntentionScreen } from '../src/components/IntentionScreen';

const mockOnBack = jest.fn();
const mockInterruptedApp = {
  packageName: 'com.instagram.android',
  appName: 'Instagram',
};

test('IntentionScreen renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <IntentionScreen onBack={mockOnBack} interruptedApp={mockInterruptedApp} />
    );
  });
});

test('IntentionScreen shows title and app name', () => {
  const component = ReactTestRenderer.create(
    <IntentionScreen onBack={mockOnBack} interruptedApp={mockInterruptedApp} />
  );
  
  const instance = component.root;
  
  // Check that the title is rendered
  const titleElement = instance.findByProps({ children: 'Set Intention' });
  expect(titleElement).toBeTruthy();
  
  // Check that the app name is shown
  const appNameElement = instance.findByProps({ children: 'Instagram' });
  expect(appNameElement).toBeTruthy();
});

test('IntentionScreen shows time options', () => {
  const component = ReactTestRenderer.create(
    <IntentionScreen onBack={mockOnBack} interruptedApp={mockInterruptedApp} />
  );
  
  const instance = component.root;
  
  // Check that time options are rendered
  const timeLabels = ['15 sec', '5 min', '10 min', '15 min', '20 min', '30 min', '45 min', '60 min'];
  timeLabels.forEach(label => {
    const timeElement = instance.findByProps({ children: label });
    expect(timeElement).toBeTruthy();
  });
}); 