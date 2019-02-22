declare module "libhoney" {
    export default class Libhoney {
        constructor(options: HoneyOptions)
        newEvent(): HoneyEvent;
    }

    export interface HoneyOptions {
        writeKey: string;
        dataset: string;
        serviceName: string;
    }

    export interface HoneyEvent {
        timestamp: Date;
        metadata: { [key: string]: any };
        addField: (key: string, value: any) => void;
        send: () => void;
    }
}
