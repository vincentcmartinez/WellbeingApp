/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SimplifyScreen } from '../src/components/SimplifyScreen';

const mockOnBack = jest.fn();

test('SimplifyScreen renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<SimplifyScreen onBack={mockOnBack} />);
  });
});

test('SimplifyScreen shows title and intro', () => {
  const component = ReactTestRenderer.create(
    <SimplifyScreen onBack={mockOnBack} />
  );
  
  const instance = component.root;
  
  // Check that the title is rendered
  const titleElement = instance.findByProps({ children: 'Simplify Your Digital Life' });
  expect(titleElement).toBeTruthy();
  
  // Check that the intro title is shown
  const introTitleElement = instance.findByProps({ children: 'Digital Decluttering' });
  expect(introTitleElement).toBeTruthy();
});

test('SimplifyScreen shows tips section', () => {
  const component = ReactTestRenderer.create(
    <SimplifyScreen onBack={mockOnBack} />
  );
  
  const instance = component.root;
  
  // Check that tips section is rendered
  const tipsTitleElement = instance.findByProps({ children: 'Tips for Digital Wellness' });
  expect(tipsTitleElement).toBeTruthy();
}); 