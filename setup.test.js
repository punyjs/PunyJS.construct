/**
* @test
*   @type setup
*   @name controller
*/
async function setupInterfaceTests(
    $entry
    , $client
    , $import
    , $global
    , $reporter
    , $config
    , $mocks
) {
    try {
        var controller = await $import(
            "controller"
        )
        , container = await $import(
            "app"
        )
        , dtree = await $import(
            "app1"
        )
        , reporter = controller
            .setup
            .getReporter()
        , reporterLevels = !!$client.config.reporterLevels
            ? $client.config.reporterLevels
            : $config.reporterLevels
        ;

        reporterLevels = !!reporterLevels
            ? JSON.parse(reporterLevels)
            : null
        ;

        controller
            .setup
            .setContainer(container)
            .setAbstractTree(dtree)
            .setGlobal($global)
        ;

        reporter
            .setCategories(reporterLevels)
            .addListener(
                function writeMessage(message) {
                    message.details = message.details || {};
                    var timestamp = message.timestamp.toPrecision(10)
                    , category = message.category
                    , level = message.details.level || 0
                    , id = message.details.id || "0".repeat(12)
                    , padding = " ".repeat(level * 4)
                    ;
                    console.log(
                        level + ": "+ padding
                        + id
                        + "(" + timestamp + ")"
                        + "[" + category + "]:"
                        + message.message
                    );
                }
            )
        ;

        controller.dependency.add(
            ".reporter"
            , reporter
        );

        reporter.info("setup complete");

        return Promise.resolve(controller);
    }
    catch(ex) {
        return Promise.reject(ex);
    }
}