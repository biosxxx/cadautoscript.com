import React from 'react';
import type {GeneratorParams, LayoutType, PartitionOrientation} from '../types';

type SelectOption<T extends string> = {value: T; label: string};

type FieldConfig =
  | {
      kind: 'number';
      name: keyof GeneratorParams;
      label: string;
      min?: number;
      step?: number;
    }
  | {
      kind: 'select';
      name: keyof GeneratorParams;
      label: string;
      options: SelectOption<string>[];
    };

type SectionConfig = {
  title: string;
  fields: FieldConfig[];
};

const layoutOptions: SelectOption<LayoutType>[] = [
  {value: 'triangular', label: 'Triangular (60 deg)'},
  {value: 'square', label: 'Square (90 deg)'},
];

const partitionOrientationOptions: SelectOption<PartitionOrientation>[] = [
  {value: 'horizontal', label: 'Horizontal'},
  {value: 'vertical', label: 'Vertical'},
];

const formSections: SectionConfig[] = [
  {
    title: 'Sheet',
    fields: [
      {kind: 'number', name: 'boardDiameter', label: 'Diameter (mm)', min: 1},
      {kind: 'number', name: 'thickness', label: 'Thickness (mm)', min: 1},
    ],
  },
  {
    title: 'Tubes',
    fields: [
      {kind: 'number', name: 'tubeDiameter', label: 'Diameter (mm)', min: 1},
      {kind: 'select', name: 'tubeLayout', label: 'Layout', options: layoutOptions},
      {kind: 'number', name: 'tubePitch', label: 'Pitch (mm)', min: 1},
      {kind: 'number', name: 'edgeMargin', label: 'Edge margin (mm)', min: 0},
    ],
  },
  {
    title: 'Partitions (visual only)',
    fields: [
      {kind: 'number', name: 'passCount', label: 'Passes', min: 1, step: 1},
      {kind: 'number', name: 'partitionWidth', label: 'Partition width (mm)', min: 0},
      {
        kind: 'select',
        name: 'partitionOrientation',
        label: 'Partition orientation',
        options: partitionOrientationOptions,
      },
    ],
  },
];

export type GeneratorFormProps = {
  params: GeneratorParams;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

export default function GeneratorForm({params, onChange}: GeneratorFormProps) {
  return (
    <div className="card">
      <div className="card__header">
        <h3>Parameters</h3>
      </div>
      <div className="card__body">
        {formSections.map((section) => (
          <div key={section.title} className="margin-bottom--md">
            <h4>{section.title}</h4>
            {section.fields.map((field) => {
              const key = field.name;
              const inputId = `tsg-${String(key)}`;

              if (field.kind === 'select') {
                return (
                  <div key={String(key)} className="margin-top--sm">
                    <label className="display-block" htmlFor={inputId}>
                      {field.label}
                    </label>
                    <select
                      id={inputId}
                      className="button--block padding--sm border-radius--sm border--solid"
                      name={String(key)}
                      value={String(params[key])}
                      onChange={onChange}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={String(key)} className="margin-top--sm">
                  <label className="display-block" htmlFor={inputId}>
                    {field.label}
                  </label>
                  <input
                    id={inputId}
                    className="button--block padding--sm border-radius--sm border--solid"
                    type="number"
                    min={field.min}
                    step={field.step}
                    name={String(key)}
                    value={params[key] as number}
                    onChange={onChange}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

