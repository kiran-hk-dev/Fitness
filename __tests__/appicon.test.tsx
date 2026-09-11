import React from 'react';
import renderer from 'react-test-renderer';
import { AppIcon, APP_ICONS } from '../src/components/AppIcon';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const stub = (name: string) => (props: any) =>
    React.createElement(name, props, props.children);
  return {
    __esModule: true,
    default: stub('Svg'),
    Svg: stub('Svg'),
    Path: stub('Path'),
    Rect: stub('Rect'),
    Circle: stub('Circle'),
    Ellipse: stub('Ellipse'),
    Polygon: stub('Polygon'),
    Polyline: stub('Polyline'),
    Line: stub('Line'),
  };
});

describe('AppIcon (font-free icons)', () => {
  it('renders every mapped glyph without crashing', () => {
    for (const name of APP_ICONS) {
      const tree = renderer.create(<AppIcon name={name} size={24} color="#fff" />).toJSON();
      expect(tree).not.toBeNull();
    }
  });
  it('falls back gracefully on unknown names', () => {
    const tree = renderer.create(<AppIcon name="nope-not-real" size={24} color="#fff" />).toJSON();
    expect(tree).not.toBeNull();
  });
});
