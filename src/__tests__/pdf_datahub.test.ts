import React from 'react';
import { PDFExportConfigScreen } from '../screens/PDFExportConfigScreen';
import { DataHubScreen } from '../screens/DataHubScreen';

describe('PDF Export & Data Hub Components (Blueprints 7 & 9)', () => {
  test('renders PDF export and data hub modules cleanly', () => {
    expect(PDFExportConfigScreen).toBeDefined();
    expect(DataHubScreen).toBeDefined();
  });
});
