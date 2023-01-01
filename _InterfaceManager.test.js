/**
* @test
*   @title PunyJS.construct._InterfaceManager
*/
function interfaceManagerTest1(
    controller
    , mock_callback
) {
    var interfaceManager, construct_prototypeManager, construct_validatorManager
    , construct_interfaces, definitions, validators, prototypes, interfaces
    ;

    arrange(
        async function arrangeFn() {
            prototypes = {
                "animal": {}
            };
            construct_prototypeManager = mock_callback(
                function mockPrototypeManager(namespace) {
                    return prototypes[namespace];
                }
            );
            validators = {
                "std.us.ssn": mock_callback(true)
                , "app.auth.accessLevels": mock_callback()
            };
            construct_validatorManager = mock_callback(
                function mockValidatorManager(namespace) {
                    return validators[namespace];
                }
            );
            construct_interfaces = mock_callback(
                function mockInterfacesResolver(namespace) {
                    return definitions[namespace];
                }
            );
            definitions = {
                "person": {
                    "prototype": "animal"
                    , "properties": {
                        "fname": {
                            "required": true
                            , "type": "string"
                        }
                        , "sname": {
                            "required": false
                            , "type": "string"
                        }
                        , "birthday": {
                            "required": false
                            , "type": "date"
                            , "readonly": true
                        }
                        , "ssn": {
                            "required": false
                            , "type": "string"
                            , "validator": "std.us.ssn"
                        }
                        , "physicality": {
                            "required": false
                            , "type": "interface"
                            , "namespace": "physicality"
                        }
                        , "accessLevel": {
                            "default": "user"
                            , "validator": "app.auth.accessLevels"
                            , "required": true
                            , "type": "string"
                        }
                    }
                }
                , "physicality": {
                    "properties": {
                        "heightCm": {
                            "required": true
                            , "type": "number"
                        }
                        , "weightKg": {
                            "required": false
                            , "type": "number"
                        }
                    }
                }
            };
            interfaces = {};
            interfaceManager = await controller(
                [
                    ":PunyJS.construct._InterfaceManager"
                    , [
                        construct_prototypeManager
                        , construct_validatorManager
                        , construct_interfaces
                    ]
                ]
            );
        }
    );

    act(
        async function actFn() {
            interfaces.joze =
                await interfaceManager
                .generate(
                    "person"
                    , {
                        "fname": "Joze"
                        , "sname": "Martinez"
                        , "physicality": {
                            "heightCm": 180
                        }
                    }
                )
            ;
            interfaces.john =
                await interfaceManager
                .generate(
                    "person"
                    , {
                        "fname": "John"
                        , "birthday": ""
                        , "physicality": {
                            "heightCm": 160.8
                            , "weightKg": "81"
                        }
                    }
                )
            ;
            ///TODO: use proxy for the generated object. Use weak map to store
            ///      a reference between the generated object and the definition
            ///      so the definition can get gc'd when no longer in use.
            delete interfaces.john.physicality;
        }
    );

    assert(
        function assertFn(test) {
            console.log(interfaces)
        }
    );
}