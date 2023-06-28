/**
* @test
*   @title PunyJS.construct._InterfaceManager: generate unit test
*/
function interfaceManagerTest1(
    controller
    , mock_callback
) {
    var interfaceManager, construct_prototypeManager, construct_validatorManager
    , construct_definitionManager
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
            construct_definitionManager = {
                "resolve": mock_callback(
                    function mockDefinitionResolve(namespace) {
                        return definitions[namespace];
                    }
                )
            };
            interfaces = {};
            interfaceManager = await controller(
                [
                    ":PunyJS.construct._InterfaceManager"
                    , [
                        construct_prototypeManager
                        , construct_definitionManager
                        , construct_validatorManager
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
                        , "physicality": {
                            "heightCm": 160.8
                            , "weightKg": "81"
                        }
                    }
                )
            ;
        }
    );

    assert(
        function assertFn(test) {
            test("the interfaces object should be")
            .value(interfaces)
            .stringify()
            .equals('{"joze":{"fname":"Joze","sname":"Martinez","accessLevel":"user","physicality":{"heightCm":180}},"john":{"fname":"John","accessLevel":"user","physicality":{"heightCm":160.8,"weightKg":"81"}}}')
            ;
        }
    );
}
/**
* @test
*   @title PunyJS.construct._InterfaceManager: validate
*/
function interfaceManagerTest2(
    controller
    , mock_callback
) {
    var interfaceManager, construct_prototypeManager, construct_validatorManager
    , construct_definitionManager
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
                    return [validators[namespace]];
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
                            "required": true
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
                            , "type": "bigint"
                        }
                        , "weightKg": {
                            "required": false
                            , "type": "number"
                        }
                    }
                }
            };
            construct_definitionManager = {
                "resolve": mock_callback(
                    function mockDefinitionResolve(namespace) {
                        return definitions[namespace];
                    }
                )
            };
            interfaces = {};
            interfaceManager = await controller(
                [
                    ":PunyJS.construct._InterfaceManager"
                    , [
                        construct_prototypeManager
                        , construct_definitionManager
                        , construct_validatorManager
                    ]
                ]
            );
        }
    );

    act(
        async function actFn() {
            interfaces.joze =
                await interfaceManager
                .validate(
                    "person"
                    , {
                        "fname": "Joze"
                        , "sname": "Martinez"
                        , "birthday": "wrong date"
                        , "physicality": {
                            "heightCm": "0b0110"
                            , "weightKg": 0xff0f
                        }
                    }
                )
            ;
            interfaces.john =
                await interfaceManager
                .validate(
                    "person"
                    , {
                        "fname": "John"
                        , "birthday": "01/12/1923"
                        , "physicality": {
                            "weightKg": 58
                        }
                    }
                )
            ;
        }
    );

    assert(
        function assertFn(test) {
            test("the interfaces object should be")
            .value(interfaces)
            .stringify()
            .equals('{"joze":{"isValid":false,"violations":["[Failed Coerce] Failed to coerce the value to the proper type\\tpropName:birthday,error:Invalid Date"]},"john":{"isValid":false,"violations":["[Missing Required Property] A required property was missing from the target and has no default\\tpropName:sname","[Missing Required Property] A required property was missing from the target and has no default\\tpropName:heightCm"]}}')
            ;
        }
    );
}
/**
* @test
*   @title PunyJS.construct._InterfaceManager: generate failed unit test
*/
function interfaceManagerTest3(
    controller
    , mock_callback
) {
    var interfaceManager, construct_prototypeManager, construct_validatorManager
    , construct_definitionManager
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
            construct_definitionManager = {
                "resolve": mock_callback(
                    function mockDefinitionResolve(namespace) {
                        return definitions[namespace];
                    }
                )
            };
            interfaces = {};
            interfaceManager = await controller(
                [
                    ":PunyJS.construct._InterfaceManager"
                    , [
                        construct_prototypeManager
                        , construct_definitionManager
                        , construct_validatorManager
                    ]
                ]
            );
        }
    );

    act(
        async function actFn() {
            try {
                await interfaceManager
                .generate(
                    "person"
                    , {
                        "fname": "Joze"
                        , "sname": "Martinez"
                        , "physicality": {
                            "heightCm": 180
                            , "weightKg": "81x"
                        }
                    }
                );
            }
            catch(ex) {
                interfaces.joze = ex.message;
            }

            try {
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
                );
            }
            catch (ex) {
                interfaces.john = ex.message;
            }
        }
    );

    assert(
        function assertFn(test) {
            test("the interfaces object should be")
            .value(interfaces)
            .stringify()
            .equals('{"joze":"[Invalid Target] The target object failed to validate\\tviolations:[Failed Coerce] Failed to coerce the value to the proper type\\tpropName:weightKg,error:Invalid Number","john":"[Invalid Target] The target object failed to validate\\tviolations:[Failed Coerce] Failed to coerce the value to the proper type\\tpropName:birthday,error:Invalid Date"}')
            ;
        }
    );
}
/**
* @test
*   @title PunyJS.construct._InterfaceManager: update value add missing value
*/
function interfaceManagerTest4(
    controller
    , mock_callback
) {
    var interfaceManager, construct_prototypeManager, construct_validatorManager
    , construct_definitionManager
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
                            , "readonly": true
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
            construct_definitionManager = {
                "resolve": mock_callback(
                    function mockDefinitionResolve(namespace) {
                        return definitions[namespace];
                    }
                )
            };
            interfaces = {};
            interfaceManager = await controller(
                [
                    ":PunyJS.construct._InterfaceManager"
                    , [
                        construct_prototypeManager
                        , construct_definitionManager
                        , construct_validatorManager
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
                        , "physicality": {
                            "heightCm": 160.8
                            , "weightKg": "81"
                        }
                    }
                )
            ;

            interfaces.joze.physicality.weightKg = 80;
            interfaces.john.sname = "Walton";
            delete interfaces.joze.sname;
        }
    );

    assert(
        function assertFn(test) {
            test("the interfaces object should be")
            .value(interfaces)
            .stringify()
            .equals('{"joze":{"fname":"Joze","accessLevel":"user","physicality":{"heightCm":180,"weightKg":80}},"john":{"fname":"John","sname":"Walton","accessLevel":"user","physicality":{"heightCm":160.8,"weightKg":"81"}}}')
            ;
        }
    );
}