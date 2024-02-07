const en = {
    translation: {
        hello_one: "hello world",
        hello_other: "hello worlds",

        // RenderControls.component.vue
        root_dataset_label: "Root dataset",
        add_label: "Add",
        edit_context_label: "Edit context",
        preview_label: "Preview",
        browse_entities_label: "Browse entities",
        save_crate_as_template_label: "Save Crate as Template",
        save_entity_template_label: "Save Entity Template",
        delete_entity_label: "Delete Entity",
        are_you_sure_to_delete: "Are you sure you want to delete this entity?",
        are_you_sure_to_delete_yes: "Yes",
        are_you_sure_to_delete_no: "No",
        add_properties_to_this_entity: "Add properties to this entity",
        edit_context: "Edit Context",
        preview_crate: "Preview Crate",
        browse_entities: "Browse entities",

        // DialogAddProperty.component.vue
        filter_attribute_set: "Filter the attribute set",

        // DialogEditContext.component.vue
        save_label: "Save",

        // DialogPreviewCrate.component.vue
        preview_loading: "loading ...",

        // DialogBrowseEntities.component.vue
        search_for_connection: "Search for a connection",

        // DialogSaveCrateAsTemplate.component.vue
        save_template_prompt: "Save this crate as a template for re-use",
        provide_name_for_template: "provide a name for the crate template",

        // RenderEntityName.component.vue
        name_field_label: "Name",
        name_field_help: "A short, descriptive name for this item.",

        // Add.component.vue
        associate_existing_prompt:
            "Associate an existing '{{addType}}' (lookup by identifier or name) or create a new '{{addType}}' by typing a name for it.",
        associate_any_prompt: "Associate any entity (lookup by identifier or name).",
        add_text: "Add text",

        // Text.component.vue
        invalid_type_for_text:
            "The type '{{type}}' is not valid for this component. It can only be 'text' or 'textarea'",
        text_constraints_error_message: "The specified value does not meet the following constraints: {{- value}}, or it is considered invalid.",

        // Date.component.vue
        pick_a_date: "Pick a date",
        invalid_date_value:
            "The supplied date '{{value}}' is invalid. Date format is: YYYY-MM-DD or an ISO String. e.g. 2021-03-22 or 2022-09-28T02:20:56.521Z.",

        // DateTime.component.vue
        pick_a_datetime: "Pick a date and time",
        invalid_datetime_value:
            "The supplied date/time '{{value}}' is invalid. Date/Time format is: YYYY-MM-DD HH:mm:ss or an ISO String. e.g. 2021-03-22 03:23:00 or 2022-09-28T02:20:56.521Z.",

        // Time.component.vue
        provide_time: "Please provide a time.",
        invalid_time_value:
            "The supplied time '{{value}}' is invalid. Time format is: HH:mm::ss. e.g. 09:03:59",

        // Number.component.vue
        invalid_number_value:
            "The supplied number '{{value}}' is invalid. The value must be a valid number passed in as a String or a Number.",
        number_constraints_error_message: "The specified number does not meet the following constraints: {{value}}",

        // Select.component.vue
        select: "Select",
        invalid_select_value:
            "The definition provided to this component has values of the wrong from. It can only be an array of strings",

        // Url.component.vue
        invalid_url_value:
            "The entry needs to be a valid url. The accepted protocols are: http, https, ftp, ftps and arcp.",

        // SelectUrl.component.vue
        // select: as above
        invalid_selecturl_value:
            "The value '{{value}}' provided to this component is of the wrong from. It can only be a valid URL.",
        invalid_selecturl_values:
            "The definition provided to this component has values of the wrong from. It can only be an array of strings which are each valid URLs.",

        // SelectObject.component.vue
        // select: as above
        invalid_selectobject_values:
            "The definition provided to this component has values of the wrong from. It can only be an array of JSON-LD objects and each object, at a minimum, must have '@id', '@type' and 'name' defined.",

        // Geo.component.vue
        define_location: "Define a location by selecting on the map",
        center_map: "center map",
        select_region: "select region",
        select_point: "select point",
        press_shift_drag_to_select: "Press the shift key and drag the mouse to select an area",
        click_on_map_to_select_point: "Click on the map to select a point",
        location_name: "Location Name",
        provide_name_for_location: "Please provide a name for this location",
        provide_name_for_location_error: "You need to provide a name for this location",
        select_existing_location: "Select existing location defined in the crate",

        // Value.component.vue
        invalid_value_value: "The supplied value '{{value}}' is invalid. It can only be a string.",

        // AutoComplete.component.vue
        select_existing_or_create_new: "select an existing entity or create a new one",
        create_new_of_type: "Create new {{type}}",
        external_lookup_timeout_error: "External Lookup Timeout",
        ror_lookup_timeout_error: "ROR Lookup Timeout",
        associate_existing_entity: "Associate an entity already defined in this crate",
        associate_entity_from_template: "Associate an entity from saved templates",
        associate_organization_from_ror:
            "Associate an Organization defined in the Research Organization Registry",
        associate_user_created_entity: "Associate a user created entity",
        associate_from_datapack: "Associate a verified entity from a datapack",
        create_new_entity: "Create new entity",

        // AddControl.component.vue
        select_a_type_to_add: "Select a type to add",

        // PaginateLinkedEntities.component.vue
        filter_the_entities: "Filter the entities",

        // RenderEntityProperty.component.vue
        not_defined_in_profile: "not defined in profile",

        // RenderReverseConnections.component.vue
        // search_for_connection: defined before
    },
};

export default en;
