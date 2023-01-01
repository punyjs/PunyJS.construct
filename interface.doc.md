# PunyJS.construct.interface

The PunyJS.construct.interface system provides a way to define object signatures, validate objects against the definitions and generate objects that fit a definition.

#### Interface Example

```json
{
    "prototype": "app.User"
    , "properties": {
        "email": {
            "validator": "std.web.email"
            , "required": true
            , "type": "string"
        }
        , "fullName": {
            "required": true
            , "type": "string"
        }
        , "birthDate": {
            "type": "date"
            , "readonly": true
        }
        , "accessLevel": {
            "default": "user"
            , "validator": "app.auth.accessLevels"
            , "required": true
            , "type": "string"
        }
    }
}
```

#### Structure

* prototype
* fields
    - field
        * name        -> the field name
        * type        -> the data type; string, number, bigint, date, bool, interface
        * [required]  -> a value is required for the field
        * [validator] -> a namespace pointing to a regular expression, validator function, or a list or a range of valid values
        * [default]   -> the default value to use
        * [readonly]  -> 
