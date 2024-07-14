export type PrimitiveType = string | number | boolean;

export type EntityReference = {
    "@id": string;
};

export type EntityProperty = PrimitiveType | EntityReference | PrimitiveType[] | EntityReference[];

export interface UnverifiedEntityDefinition {
    "@id"?: string;
    "@type"?: string | number | boolean | string[] | number[] | boolean[];
    name?: string;
    [key: string]: EntityProperty | undefined;
}

export interface PartiallyVerifiedEntityDefinition {
    "@id"?: string;
    "@type": string[];
    name?: string;
    [key: string]: EntityProperty | undefined;
}

export interface NormalisedEntityDefinition {
    "@id": string;
    "@type": string[];
    name: string;
    [key: string]: EntityProperty | undefined;
}
