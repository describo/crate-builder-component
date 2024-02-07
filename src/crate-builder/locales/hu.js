const hu = {
    translation: {
        hello_one: "szia világ",
        hello_other: "sziasztok világok",

        // RenderControls.component.vue
        root_dataset_label: "Gyökér adatcsomag",
        add_label: "Új elem",
        edit_context_label: "Kontextus szerkesztése",
        preview_label: "Előnézet",
        browse_entities_label: "Entitás böngésző",
        save_crate_as_template_label: "Mentés csomag mintaként",
        save_entity_template_label: "Mentés entitás mintaként",
        delete_entity_label: "Entitás törlése",
        are_you_sure_to_delete: "Biztosan törölni akarja az entitást?",
        are_you_sure_to_delete_yes: "Igen",
        are_you_sure_to_delete_no: "Nem",
        add_properties_to_this_entity: "Új adat hozzáadása az entitáshoz",
        edit_context: "Kontextus szerkesztése",
        preview_crate: "Csomag előnézete",
        browse_entities: "Entitások böngészése",

        // DialogAddProperty.component.vue
        filter_attribute_set: "Attribútumok szűrése",

        // DialogEditContext.component.vue
        save_label: "Mentés",

        // DialogPreviewCrate.component.vue
        preview_loading: "betöltés ...",

        // DialogBrowseEntities.component.vue
        search_for_connection: "Kapcsolt entitás keresése",

        // DialogSaveCrateAsTemplate.component.vue
        save_template_prompt: "Csomag mentése mintaként",
        provide_name_for_template: "minta neve",

        // RenderEntityName.component.vue
        name_field_label: "Név",
        name_field_help: "Az entitás rövid, leíró neve",

        // Add.component.vue
        associate_existing_prompt:
            "Egy létező '{{addType}}' társítása (név vagy azonosító alapú kereséssel) vagy egy új '{{addType}}' létrehozása a név megadásával",
        associate_any_prompt: "Bármely entitás hozzárendelése (azonosító vagy név alapján)",
        add_text: "Szöveg hozzáadása",

        // Text.component.vue
        invalid_type_for_text:
            "'{{type}}' típus nem használható ezzel a komponenssel. A típus csak 'text' vagy 'textarea' lehet",
        text_constraints_error_message: "A megadott érték nem felel meg a következő megszorításoknak: {{- value}}, vagy érvénytelen.",

        // Date.component.vue
        pick_a_date: "Válassz dátumot!",
        invalid_date_value:
            "A megadott dátum '{{value}}' nem megfelelő. Az elvárt dátum formátum: YYYY-MM-DD vagy egy ISO dátum, pl. 2021-03-22 or 2022-09-28T02:20:56.521Z.",

        // DateTime.component.vue
        pick_a_datetime: "Válassz dátumot és időt!",
        invalid_datetime_value:
            "A megadott dátum/idő '{{value}}' nem megfelelő. Az elvárt dátum/idő formátum: YYYY-MM-DD HH:mm:ss vagy egy ISO dátum, pl. 2021-03-22 03:23:00 or 2022-09-28T02:20:56.521Z.",

        // Time.component.vue
        provide_time: "Add meg az időt!",
        invalid_time_value:
            "A megadott érték '{{value}}' nem megfelelő. Az elvárt idő formátum: HH:mm::ss. pl. 09:03:59",

        // Number.component.vue
        invalid_number_value:
            "A megadott érték '{{value}}' nem megfelelő. Az értéket String vagy Number típusként kell megadni",
        number_constraints_error_message: "A megadott szám nem felel meg a következő megszorításoknak: {{value}}",

        // Select.component.vue
        select: "Válassz!",
        invalid_select_value:
            "A komponensnek adott definíció értékei nem megfelelő formátumban vannak. Csak karakterláncokból álló tömb lehet.",

        // Url.component.vue
        invalid_url_value:
            "A bejegyzésnek érvényes URL-nek kell lennie. Az elfogadott protokollok: http, https, ftp, ftps és arcp.",

        // SelectUrl.component.vue
        // select: as above
        invalid_selecturl_value:
            "A megadott '{{value}}' érték nem megfelelő formátumú. Csak érvényes URL lehet.",
        invalid_selecturl_values:
            "A komponensnek adott definíció értékei nem megfelelő formátumban vannak. Csak olyan karakterláncokból álló tömb lehet, amelyek mindegyike érvényes URL.",

        // SelectObject.component.vue
        // select: as above
        invalid_selectobject_values:
            "A komponensnek adott definíció értékei nem megfelelő formátumban vannak. Csak JSON-LD objektumokból álló tömb lehet, és minden objektumnak legalább '@id', '@type' és 'name' meghatározással kell rendelkeznie.",

        // Geo.component.vue
        define_location: "Határozz meg egy helyet a térképen történő kiválasztással!",
        center_map: "térkép középre állítása",
        select_region: "régió kiválasztása",
        select_point: "pont kiválasztása",
        press_shift_drag_to_select:
            "Nyomd le a shift billentyűt és húzd az egérrel, hogy kijelölj egy területet",
        click_on_map_to_select_point: "Kattints a térképre, hogy kiválaszthass egy pontot",
        location_name: "Hely neve",
        provide_name_for_location: "Adj nevet ennek a helynek!",
        provide_name_for_location_error: "A hely nevének megadása kötelező!",
        select_existing_location: "Válassz egy már meghatározott helyet a csomagban!",

        // Value.component.vue
        invalid_value_value: "A megadott '{{value}}' érték érvénytelen. Csak karakterlánc lehet.",

        // AutoComplete.component.vue
        select_existing_or_create_new: "válassz egy meglévő entitást vagy hozz létre egy újat",
        create_new_of_type: "Új {{type}} létrehozása",
        external_lookup_timeout_error: "Külső lekérdezési időtúllépés",
        ror_lookup_timeout_error: "ROR lekérdezési időtúllépés",
        associate_existing_entity: "Kapcsolj egy már ebben a csomagban definiált entitást",
        associate_entity_from_template: "Kapcsolj egy mentett sablonból származó entitást",
        associate_organization_from_ror:
            "Kapcsolj egy a Research Organization Registryben definiált szervezetet",
        associate_user_created_entity: "Kapcsolj egy felhasználó által létrehozott entitást",
        associate_from_datapack: "Kapcsolj egy ellenőrzött entitást egy adatcsomagból",
        create_new_entity: "Új entitás létrehozása",

        // AddControl.component.vue
        select_a_type_to_add: "Válassz hozzáadandó típust",

        // PaginateLinkedEntities.component.vue
        filter_the_entities: "Entitások szűrése",

        // RenderEntityProperty.component.vue
        not_defined_in_profile: "nincs definiálva a profilban",

        // RenderReverseConnections.component.vue
        // search_for_connection: defined before
    },
};

export default hu;
