/* Javascript for HTMLXBlock. */

const CUSTOM_FONTS = "Default='Open Sans', Verdana, Arial, Helvetica, sans-serif;";
const STANDARD_FONTS = "Andale Mono=andale mono,times;" + "Arial=arial,helvetica,sans-serif;" + "Arial Black=arial black,avant garde;" + "Book Antiqua=book antiqua,palatino;" + "Comic Sans MS=comic sans ms,sans-serif;" + "Courier New=courier new,courier;" + "Georgia=georgia,palatino;" + "Helvetica=helvetica;" + "Impact=impact,chicago;" + "Symbol=symbol;" + "Tahoma=tahoma,arial,helvetica,sans-serif;" + "Terminal=terminal,monaco;" + "Times New Roman=times new roman,times;" + "Trebuchet MS=trebuchet ms,geneva;" + "Verdana=verdana,geneva;" + "Webdings=webdings;" + "Wingdings=wingdings,zapf dingbats";
const FONTS = CUSTOM_FONTS + STANDARD_FONTS;

function openTab(evt, tabName) {
  /**
   * This method has been adopted as found in https://www.w3schools.com/howto/howto_js_tabs.asp
   */
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
    tablinks[i].setAttribute("aria-selected", false);
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
  evt.currentTarget.setAttribute("aria-selected", true);
}

function configureTheEditor(data) {
  const contentSelector = "textarea#html5-textarea";
  const languageWrapper = document.querySelectorAll(".wrapper-view, .window-wrap");
  const directionality = (languageWrapper.length > 0) ? languageWrapper.dir : "ltr";
  var editor;

  if (data.editor === "visual") {
    tinymce.remove(contentSelector);
    editor = tinymce.init({
      script_url: data.script_url,
      skin_url: data.skin_url,
      theme: "silver",
      skin: "studio-tmce5",
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
  for (var i in fields) {
    var field = fields[i];
    if (field.isSet()) {
      values[field.name] = field.val();
    } else {
      notSet.push(field.name);
    }
  }

  return {
    values: values,
    defaults: notSet
  }
}

function extractXBlockFields() {
  /**
   * The content of this function is as found in xblockutils#studio_edit.js
   */
  var elements;
  var fields = [];

  elements = document.querySelectorAll(".field-data-control");
  Array.prototype.forEach.call(elements, function (item) {
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

    var datepickerAvailable = (typeof $.fn.datepicker !== 'undefined'); // Studio includes datepicker jQuery plugin
    if (type == 'datepicker' && datepickerAvailable) {
      $field.datepicker('destroy');
      $field.datepicker({ dateFormat: "m/d/yy" });
    }
  });

  elements = document.querySelectorAll(".wrapper-list-settings .list-set");
  Array.prototype.forEach.call(elements, function (item) {
    var $optionList = $(item);
    var $checkboxes = $(item).find('input');
    var $wrapper = $optionList.closest('li');
    var $resetButton = $wrapper.find('button.setting-clear');

    fields.push({
      name: $wrapper.data('field-name'),
      isSet: function () {
        return $wrapper.hasClass('is-set');
      },
      val: function () {
        var val = [];
        $checkboxes.each(function () {
          if ($(item).is(':checked')) {
            val.push(JSON.parse($(item).val()));
          }
        });
        return val;
      }
    });

    var fieldChanged = function () {
      // Field value has been modified:
      $wrapper.addClass('is-set');
      $resetButton.removeClass('inactive').addClass('active');
    };
    $checkboxes.bind("change input", fieldChanged);

    $resetButton.click(function () {
      var defaults = JSON.parse($wrapper.attr('data-default'));
      $checkboxes.each(function () {
        var val = JSON.parse($(item).val());
        $(item).prop('checked', defaults.indexOf(val) > -1);
      });
      $wrapper.removeClass('is-set');
      $resetButton.removeClass('active').addClass('inactive');
    });
  });

  return fields;
}

function KashidaHTMLLayoutXBlock(runtime, element, data) {
  // Ensure the default tab is selected
  const defaultTab = document.getElementById("default-tab");
  if (defaultTab) {
      defaultTab.click();
  }

  // Configure the editor
  const editor = configureTheEditor(data);

  // Extract XBlock fields (ensure the function is defined elsewhere)
  var fields = extractXBlockFields();

  // Extract default values for text content, image URL, and layout
  var textContent = data.text_content || "";
  var imageUrl = data.image_url || "";
  var layout = data.layout || "left_right";  // Default layout

  // Function to handle form submission
  function studioSubmit() {
      // Define the URLs for content and settings submission
      const ContentHandlerUrl = runtime.handlerUrl(element, "update_content");
      const SettingsHandlerUrl = runtime.handlerUrl(element, "submit_studio_edits");

      // Get the content from the editor based on the editor mode
      const content = (data.editor === "visual")
          ? document.getElementById("text-content").value
          : editor.getValue();

      // Get the image URL from the input field
      const imageUrl = document.getElementById("image-url")?.value || "";

      // Get the layout value
      const layout = document.querySelector('.layout-wrapper')?.getAttribute('data-layout') || "left_right";

      // Prepare the data to be sent to the server
      const fields_data = {
          text_content: textContent,
          image_url: imageUrl,
          layout: layout,
      };

      // Define error message to show if AJAX fails
      var errorMessage = "This may be happening because of an error with our server or your internet connection. Try refreshing the page or making sure you are online.";

      // Notify Studio that the save process has started
      runtime.notify('save', { state: 'start', message: "Saving" });

      // Send AJAX request to update settings
      $.ajax({
          type: "POST",
          url: SettingsHandlerUrl,
          data: JSON.stringify(fields_data),
          dataType: "json",
          global: false,  // Prevent conflict with Studio's error handling
          success: function () {
              // Once settings are saved, send AJAX request to update content
              $.ajax({
                  type: "POST",
                  url: ContentHandlerUrl,
                  data: JSON.stringify({ "content": content }),
                  dataType: "json",
                  global: false,
                  success: function () {
                      // Notify Studio that save has completed
                      runtime.notify('save', { state: 'end' });
                  },
                  fail: function () {
                      // Notify error if content update fails
                      runtime.notify('error', { title: "Unable to update content", message: errorMessage });
                  }
              });
          },
          fail: function (jqXHR) {
              // Error handling for settings update
              if (jqXHR.responseText) {
                  try {
                      errorMessage = JSON.parse(jqXHR.responseText).error || errorMessage;
                      if (typeof errorMessage === "object" && errorMessage.messages) {
                          // Extract specific error messages if available
                          errorMessage = $.map(errorMessage.messages, function (msg) {
                              return msg.text;
                          }).join(", ");
                      }
                  } catch (error) {
                      errorMessage = jqXHR.responseText.substr(0, 300);
                  }
              }
              // Notify Studio of the error
              runtime.notify('error', { title: "Unable to update settings", message: errorMessage });
          }
      });
  }

  // Normalize the element to handle both jQuery and DOM elements
  element = Array.isArray(element) ? element[0] : element;

  // Utility function to add click event listener to elements
  const addClickFn = function (el, fn) {
      el.addEventListener("click", function (event) {
          event.preventDefault();
          fn(event);
      });
  };

  // Attach event listeners for save and cancel buttons
  element.querySelectorAll('.save-button').forEach(button => {
      addClickFn(button, studioSubmit);
  });

  element.querySelectorAll('.cancel-button').forEach(button => {
      addClickFn(button, function () {
          runtime.notify('cancel', {});
      });
  });
}