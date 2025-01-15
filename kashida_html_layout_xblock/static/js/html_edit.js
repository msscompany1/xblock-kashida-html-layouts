/* Updated JavaScript for Kashida Layout HTML XBlock */

const CUSTOM_FONTS = "Default='Open Sans', Verdana, Arial, Helvetica, sans-serif;";
const STANDARD_FONTS = "Andale Mono=andale mono,times;" +
    "Arial=arial,helvetica,sans-serif;" +
    "Arial Black=arial black,avant garde;" +
    "Book Antiqua=book antiqua,palatino;" +
    "Comic Sans MS=comic sans ms,sans-serif;" +
    "Courier New=courier new,courier;" +
    "Georgia=georgia,palatino;" +
    "Helvetica=helvetica;" +
    "Impact=impact,chicago;" +
    "Symbol=symbol;" +
    "Tahoma=tahoma,arial,helvetica,sans-serif;" +
    "Terminal=terminal,monaco;" +
    "Times New Roman=times new roman,times;" +
    "Trebuchet MS=trebuchet ms,geneva;" +
    "Verdana=verdana,geneva;" +
    "Webdings=webdings;" +
    "Wingdings=wingdings,zapf dingbats";
const FONTS = CUSTOM_FONTS + STANDARD_FONTS;

function openTab(evt, tabName) {
    const tabcontent = document.querySelectorAll(".tabcontent");
    const tablinks = document.querySelectorAll(".tablinks");

    tabcontent.forEach(tab => tab.style.display = "none");
    tablinks.forEach(link => {
        link.classList.remove("active");
        link.setAttribute("aria-selected", false);
    });

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
    evt.currentTarget.setAttribute("aria-selected", true);
}

function configureTheEditor(data) {
    const contentSelector = "textarea#html5-textarea";
    const languageWrapper = document.querySelectorAll(".wrapper-view, .window-wrap");
    const directionality = (languageWrapper.length > 0) ? languageWrapper[0].dir : "ltr";
    let editor;

    if (data.editor === "visual") {
        tinymce.remove(contentSelector);
        editor = tinymce.init({
            script_url: data.script_url,
            skin_url: data.skin_url,
            theme: "silver",
            schema: "html5",
            convert_urls: false,
            directionality: directionality,
            selector: contentSelector,
            menubar: false,
            statusbar: false,
            valid_elements: "*[*]",
            extended_valid_elements: "*[*]",
            valid_children: "+body[style]",
            invalid_elements: "",
            font_formats: FONTS,
            toolbar: "formatselect | fontselect | bold italic underline forecolor codesample | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent blockquote | link unlink image | table tabledelete | code",
            table_class_list: data.table_custom_classes.map(c => ({ title: c, value: c })),
            external_plugins: data.external_plugins,
            formats: {
                code: {
                    inline: 'code'
                }
            },
            visual: false,
            image_advtab: true,
            block_formats: "Paragraph=p;Preformatted=pre;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6",
            width: '100%',
            height: '315px',
            browser_spellcheck: true,
            codemirror: {
                path: data.codemirror_path,
                jsFiles: ["codemirror-compressed.js"],
                cssFiles: ["CodeMirror/codemirror.css"],
                width: 770,
                height: 454,
                saveCursorPosition: false, // Caret Markers were introducing invalid chars (https://github.com/christiaan/tinymce-codemirror/issues/26)
                config: {
                    mode: 'text/html',
                }
            }
        });
    } else {
        editor = CodeMirror.fromTextArea(document.querySelectorAll(contentSelector)[0], {
            mode: "text/html",
            lineNumbers: true,
            matchBrackets: true,
            lineWrapping: true,
        });
    }

    return editor;
}

function getSettingsValues(fields) {
    var values = {};
    var notSet = []; // List of field names that should be set to default values
    fields.forEach(field => {
        if (field.isSet()) {
            values[field.name] = field.val();
        } else {
            notSet.push(field.name);
        }
    });

    return {
        values: values,
        defaults: notSet
    }
}

function extractXBlockFields() {
    var elements;
    var fields = [];

    elements = document.querySelectorAll(".field-data-control");
    elements.forEach(item => {
        var $field = $(item);
        var $wrapper = $field.closest('li');
        var $resetButton = $wrapper.find('button.setting-clear');
        var type = $wrapper.data('cast');

        fields.push({
            name: $wrapper.data('field-name'),
            isSet: function () {
                return $wrapper.hasClass('is-set');
            },
            val: function () {
                var val = $field.val();
                // Cast values to the appropriate type so that we send nice clean JSON over the wire:
                if (type == 'boolean')
                    return (val == 'true' || val == '1');
                if (type == "integer")
                    return parseInt(val, 10);
                if (type == "float")
                    return parseFloat(val);
                if (type == "generic" || type == "list" || type == "set") {
                    val = val.trim();
                    if (val === "")
                        val = null;
                    else
                        val = JSON.parse(val);
                }
                return val;
            }
        });
        var fieldChanged = function () {
            // Field value has been modified:
            $wrapper.addClass('is-set');
            $resetButton.removeClass('inactive').addClass('active');
        };
        $field.bind("change input paste", fieldChanged);
        $resetButton.click(function () {
            $field.val($wrapper.attr('data-default')); // Use attr instead of data to force treating the default value as a string
            $wrapper.removeClass('is-set');
            $resetButton.removeClass('active').addClass('inactive');
        });
    });

    return fields;
}

function HTML5XBlock(runtime, element, data) {
    document.getElementById("default-tab").click();  // Will open the XBlock by showing the default tab

    const editor = configureTheEditor(data);
    var fields = extractXBlockFields();

    function studioSubmit() {
        const ContentHandlerUrl = runtime.handlerUrl(element, "update_content");
        const SettingsHandlerUrl = runtime.handlerUrl(element, "submit_studio_edits");
        const content = (data.editor === "visual") ? tinymce.get("html5-textarea").getContent() : editor.getValue();
        const fields_data = getSettingsValues(fields);
        var errorMessage = "This may be happening because of an error with our server or your internet connection. Try refreshing the page or making sure you are online.";

        runtime.notify('save', { state: 'start', message: "Saving" });
        $.ajax({
            type: "POST",
            url: SettingsHandlerUrl,
            data: JSON.stringify(fields_data),
            dataType: "json",
            global: false,
            success: function (response) {
                $.ajax({
                    type: "POST",
                    url: ContentHandlerUrl,
                    data: JSON.stringify({ "content": content }),
                    dataType: "json",
                    global: false,
                    success: function (response) {
                        runtime.notify('save', { state: 'end' });
                    }
                }).fail(function (jqXHR) {
                    runtime.notify('error', { title: "Unable to update content", message: errorMessage });
                })
            }
        }).fail(function (jqXHR) {
            if (jqXHR.responseText) {
                try {
                    errorMessage = JSON.parse(jqXHR.responseText).error;
                    if (typeof errorMessage === "object" && errorMessage.messages) {
                        errorMessage = $.map(errorMessage.messages, function (msg) {
                            return msg.text;
                        }).join(", ");
                    }
                } catch (error) {
                    errorMessage = jqXHR.responseText.substr(0, 300);
                }
            }
            runtime.notify('error', { title: "Unable to update settings", message: errorMessage });
        })
    }

    element.querySelectorAll('.save-button').forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            studioSubmit();
        });
    });

    element.querySelectorAll('.cancel-button').forEach(button => {
        button.addEventListener("click", function () {
            runtime.notify('cancel', {});
        });
    });
}
