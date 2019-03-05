import Libhoney, { HoneyEvent, HoneyOptions } from 'libhoney';

const noop = () => {};

interface DummyOptions {
  addField?: (key: string, value: any) => void;
  send?: () => void;
}

class DummyHoney extends Libhoney {
  private dummyOptions: DummyOptions;

  constructor(options: HoneyOptions, dummyOptions?: DummyOptions) {
    super(options);
    this.dummyOptions = dummyOptions || {};
  }

  newEvent(): HoneyEvent {
    const { addField, send } = this.dummyOptions;
    return {
      addField: addField || noop,
      send: send || noop,
    };
  }
}

export function newDummyHoney(options?: DummyOptions) {
  return new DummyHoney(
    {
      writeKey: 'test',
      dataset: 'test',
      disabled: true,
    },
    options,
  );
}
