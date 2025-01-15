// Constants for layout
const CUSTOM_FONTS = "Default='Open Sans', Verdana, Arial, Helvetica, sans-serif;";
const STANDARD_FONTS = "Andale Mono=andale mono,times;" + "Arial=arial,helvetica,sans-serif;" + "Arial Black=arial black,avant garde;" + "Book Antiqua=book antiqua,palatino;" + "Comic Sans MS=comic sans ms,sans-serif;" + "Courier New=courier new,courier;" + "Georgia=georgia,palatino;" + "Helvetica=helvetica;" + "Impact=impact,chicago;" + "Symbol=symbol;" + "Tahoma=tahoma,arial,helvetica,sans-serif;" + "Terminal=terminal,monaco;" + "Times New Roman=times new roman,times;" + "Trebuchet MS=trebuchet ms,geneva;" + "Verdana=verdana,geneva;" + "Webdings=webdings;" + "Wingdings=wingdings,zapf dingbats";
const FONTS = CUSTOM_FONTS + STANDARD_FONTS;

function openTab(evt, tabName) {
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

function getSettingsValues(fields) {
  var values = {};
  var notSet = [];
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
  };
}

function extractXBlockFields() {
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
        if (type == 'boolean') return (val == 'true' || val == '1');
        if (type == "integer") return parseInt(val, 10);
        if (type == "float") return parseFloat(val);
        if (type == "generic" || type == "list" || type == "set") {
          val = val.trim();
          if (val === "") val = null;
          else val = JSON.parse(val);
        }
        return val;
      }
    });

    var fieldChanged = function () {
      $wrapper.addClass('is-set');
      $resetButton.removeClass('inactive').addClass('active');
    };
    $field.bind("change input paste", fieldChanged);

    $resetButton.click(function () {
      $field.val($wrapper.attr('data-default'));
      $wrapper.removeClass('is-set');
      $resetButton.removeClass('active').addClass('inactive');
    });
  });

  return fields;
}

function HTML5XBlock(runtime, element, data) {
  document.getElementById("default-tab").click();  // Will open the XBlock by showing the default tab

  var fields = extractXBlockFields();
  
  // Function to handle saving the layout settings
  function saveLayoutSettings() {
    const settingsHandlerUrl = runtime.handlerUrl(element, "submit_studio_edits");
    const fields_data = getSettingsValues(fields);
    var errorMessage = "This may be happening because of an error with our server or your internet connection. Try refreshing the page or making sure you are online.";

    runtime.notify('save', { state: 'start', message: "Saving" });
    $.ajax({
      type: "POST",
      url: settingsHandlerUrl,
      data: JSON.stringify(fields_data),
      dataType: "json",
      global: false,
      success: function (response) {
        runtime.notify('save', { state: 'end' });
      }
    }).fail(function (jqXHR) {
      runtime.notify('error', { title: "Unable to update settings", message: errorMessage });
    });
  }

  // Function to handle saving the content (image and text)
  function saveContent() {
    const contentHandlerUrl = runtime.handlerUrl(element, "update_content");
    const content = document.querySelector('#image-upload').value; // Get image file
    const text = document.querySelector('#text-input').value; // Get input text
    const contentData = { "content": { image: content, text: text } };

    $.ajax({
      type: "POST",
      url: contentHandlerUrl,
      data: JSON.stringify(contentData),
      dataType: "json",
      global: false,
      success: function (response) {
        runtime.notify('save', { state: 'end' });
      }
    }).fail(function (jqXHR) {
      runtime.notify('error', { title: "Unable to update content", message: errorMessage });
    });
  }

  // Event listeners for saving settings and content
  element.querySelectorAll('.save-settings').forEach(button => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      saveLayoutSettings();
    });
  });

  element.querySelectorAll('.save-content').forEach(button => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      saveContent();
    });
  });

  // Event listener for cancel button
  element.querySelectorAll('.cancel-button').forEach(button => {
    button.addEventListener("click", function () {
      runtime.notify('cancel', {});
    });
  });
}
