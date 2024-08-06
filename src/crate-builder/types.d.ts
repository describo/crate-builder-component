// CRATE RELATED DEFINITIONS
// Entity Type Definition
export type PrimitiveType = string | number | boolean;

export type EntityReference = {
    "@id": string;
};

export interface UnverifiedEntityDefinition {
    "@id"?: string;
    "@type"?: (string | number | boolean)[] | string | number | boolean;
    name?: string;
    [key: string]:
        | (PrimitiveType | EntityReference | undefined | null)[]
        | PrimitiveType
        | EntityReference;
}

export interface NormalisedEntityDefinition {
    "@id": string;
    "@type": string[];
    name: string;
    [key: string]: (PrimitiveType | EntityReference)[];
}

// Context Type Definition
export type UnverifiedContext = any;

type NormalisedContext = [
    ...string[],
    {
        [key: string]: string;
    },
];

// Crate Type Definition
export interface UnverifiedCrate {
    "@context": UnverifiedContext;
    "@graph": UnverifiedEntityDefinition[];
}

export interface NormalisedCrate {
    "@context": NormalisedContext;
    "@graph": NormalisedEntityDefinition[];
}

export class CrateManagerType {
    crate: {
        "@context": NormalisedContext;
        "@graph": Array<NormalisedEntityDefinition | undefined>;
    };
    pm: ProfileManagerType;
    reverse: {
        [key: string]: any;
    };
    graphLength: number;
    rootDescriptor?: number;
    rootDataset?: number;
    entityIdIndex: {
        [key: string]: number;
    };
    providedContext: UnverifiedContext;
    contextDefinitions: { [key: string]: boolean };
    localContext: { [key: string]: string };
    entityTypes: { [key: string]: number };
    entityTimestamps: Boolean;
    blankNodes: string[];
    coreProperties: string[];
    errors: {
        hasError: Boolean;
        init: { description: string; messages: string[] };
        missingIdentifier: { description: string; entity: UnverifiedEntityDefinition[] };
        missingTypeDefinition: { description: string; entity: UnverifiedEntityDefinition[] };
        invalidIdentifier: { description: string; entity: UnverifiedEntityDefinition[] };
    };
    warnings: {
        hasWarning: Boolean;
        init: { description: string; messages: string[] };
        invalidIdentifier: { description: string; entity: UnverifiedEntityDefinition[] };
    };
    constructor({
        crate,
        pm,
        context = undefined,
        entityTimestamps = false,
    }: {
        crate: UnverifiedCrate;
        pm: ProfileManagerType;
        context: UnverifiedContext;
        entityTimestamps: Boolean;
    });
    setContext(context: NormalisedContext);
    setProfileManager(pm: ProfileManagerType);
    getRootDataset(): NormalisedEntityDefinition;
    getEntity({
        id,
        stub = false,
        link = true,
        materialise = true,
    }: {
        id: string;
        stub?: boolean;
        link?: boolean;
        materialise?: boolean;
    }): NormalisedEntityDefinition | undefined;
    getEntityTypes(): string[];
    *getEntities(
        params: { limit?: number; query?: string; type?: string } = {
            limit: undefined,
            query: undefined,
            type: undefined,
        }
    ): Generator<NormalisedEntityDefinition>;
    locateEntity({
        entityIds,
        strict = true,
    }: {
        entityIds: string[];
        strict: boolean;
    }): NormalisedEntityDefinition[] | undefined;
    resolveLinkedEntityAssociations({
        entity,
        profile,
    }: {
        entity: NormalisedEntityDefinition;
        profile: NormalisedProfile;
    }):
        | {
              property: string;
              "@id": string;
              "@type": string[];
              name: string;
          }[]
        | [];
    addEntity(entity: UnverifiedEntityDefinition): NormalisedEntityDefinition;
    addBlankNode(type: string): NormalisedEntityDefinition;
    addFileOrFolder({
        path,
        type = "File",
    }: {
        path: string;
        type: string;
    }): NormalisedEntityDefinition;
    addFile(path: string): NormalisedEntityDefinition;
    addFolder(path: string): NormalisedEntityDefinition;
    deleteEntity({ id }: { id: string });
    setProperty({
        id,
        property,
        propertyId,
        value,
    }: {
        id: string;
        property: string;
        propertyId?: string;
        value: PrimitiveType | EntityReference;
    }): boolean | undefined;
    updateProperty({
        id,
        property,
        idx,
        value,
    }: {
        id: string;
        property: string;
        idx: number;
        value: PrimitiveType | PrimitiveType[] | EntityReference;
    }): NormalisedEntityDefinition | undefined | string;
    deleteProperty({ id, property, idx }: { id: string; property: string; idx?: number });
    ingestAndLink({
        id = undefined,
        property = undefined,
        propertyId = undefined,
        json = {},
    }: {
        id: string | undefined;
        property: string | undefined;
        propertyId: string | undefined;
        json: UnverifiedEntityDefinition;
    });
    flatten(json: UnverifiedEntityDefinition): NormalisedEntityDefinition[];
    linkEntity({
        id,
        property,
        propertyId = undefined,
        value,
    }: {
        id: string;
        property: string;
        propertyId?: string;
        value: { "@id": string };
    }): void;
    unlinkEntity({
        id = undefined,
        property = undefined,
        value = undefined,
        stop = false,
    }: {
        id: string | undefined;
        property: string | undefined;
        value: { "@id": string } | undefined;
        stop?: boolean;
    });
    purgeUnlinkedEntities(): void;
    exportEntityTemplate({
        id,
        resolveDepth = 0,
    }: {
        id: string;
        resolveDepth: number;
    }): NormalisedEntityDefinition;
    getErrors(): errorsInterface;
    getWarnings(): warningsInterface;
    __updateContext({ name, id }: { name: string; id?: string }): void;
    __normaliseContext(context: UnverifiedContext): NormalisedContext;
    __storeEntityType(entity: NormalisedEntityDefinition): void;
    __removeEntityType(entity: NormalisedEntityDefinition);
    __collectAllDefinitions(context: NormalisedContext): { [key: string]: boolean };
    __setError(error: keyof typeof this.errors, entity: string | UnverifiedEntityDefinition);
    __setWarning(warning: keyof typeof this.warnings, entity: string | UnverifiedEntityDefinition);
    __materialiseEntity({ id }: { id: string }): NormalisedEntityDefinition;
    __confirmNoClash({
        entity,
        mintNewId = true,
    }: {
        entity: NormalisedEntityDefinition;
        mintNewId?: boolean;
    }): NormalisedEntityDefinition | boolean;
    __updateEntityId({ oldId, newId }: { oldId: string; newId: string });
    __addReverse({ id, property, value }: { id: string; property: string; value: EntityReference });
    __removeAssociations(entity: NormalisedEntityDefinition): NormalisedEntityDefinition;
}

// PROFILE RELATED DEFINITIONS
export interface ProfileLayoutGroup {
    name: string;
    label: string;
    description?: string;
    order?: number;
    inputs: ProfileInput[];
    properties?: string[];
    hasData?: boolean;
    missingRequiredData?: boolean;
}
export interface ProfileLayout {
    appliesTo: string[];
    [key: string]: ProfileLayoutGroup;
}

export type ProfileAssociation = {
    property: string;
    propertyId: string;
    inverse: { property: string; propertyId: string };
};

export type ProfileInput = {
    id: string;
    name: string;
    label?: string;
    help?: string;
    required?: boolean;
    multiple?: boolean;
    hide?: boolean;
    group?: string;
    type: string[];
};
export interface NormalisedProfile {
    metadata: {
        name: string;
        description: string;
        version: number;
        warnMissingProperty: boolean;
    };
    context: string | (string | { [key: string]: string })[] | { [key: string]: string };
    layouts: ProfileLayout[];
    resolve: {
        types: string[];
        properties: string[];
    }[];
    propertyAssociations: ProfileAssociation[];
    localisation: { [key: string]: string };
    lookup: {
        [key: string]: { fields: stringp[]; datapacks: string[] };
    };
    classes: {
        [className: string]: {
            definition: "override" | "inherit";
            subClassOf: string[];
            inputs: ProfileInput[];
        };
    };
}

export class ProfileManagerType {
    profile: Profile;
    constructor({ profile }: { profile: Profile });
    getLayout({ entity }: { entity: Entity }): Layout | null;
    getPropertyAssociations(): { [key: string]: { property: string; propertyId?: string } };
    getClasses(): string[];
    getEntityTypeHierarchy({ entity }: { entity: Entity }): string[];
    getPropertyDefinition({ property, entity }: { property: string; entity: Entity }): {
        propertyDefinition: any;
    };
    mapTypeHierarchies({ types }: { types: string[] }): string[];
    getInputsFromProfile({ entity }: { entity: Entity }): any[];
    getAllInputs({ entity }: { entity: Entity }): { inputs: any[] };
    getTypeDefinition({ entity }: { entity: Entity }): "inherit" | "override";
    getTypeLabel(type: string): string;
}
