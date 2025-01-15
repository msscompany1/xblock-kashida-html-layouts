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
            font_formats: FONTS,
            toolbar: "formatselect | fontselect | bold italic underline forecolor codesample | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent blockquote | link unlink image | table tabledelete | code",
            table_class_list: data.table_custom_classes.map(c => ({ title: c, value: c })),
            external_plugins: data.external_plugins,
            image_advtab: true,
            width: '100%',
            height: '315px',
            browser_spellcheck: true,
        });
    } else {
        editor = CodeMirror.fromTextArea(document.querySelector(contentSelector), {
            mode: "text/html",
            lineNumbers: true,
            matchBrackets: true,
            lineWrapping: true,
        });
    }

    return editor;
}

function displayImageWithText(imageUrl, textContent, layout) {
    const displayArea = document.getElementById('display-area');
    displayArea.innerHTML = `
        <div class="layout ${layout}">
            <div class="text-content">${textContent}</div>
            <div class="image-content">
                <img src="${imageUrl}" alt="Uploaded Image">
            </div>
        </div>
    `;
}

function previewImage() {
    const imageInput = document.querySelector('#image-upload');
    const previewArea = document.querySelector('#image-preview');

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewArea.innerHTML = `<img src="${e.target.result}" alt="Image Preview" />`;
        };
        reader.readAsDataURL(imageInput.files[0]);
    }
}

function studioSubmit() {
    const contentInput = document.querySelector('#html5-textarea');
    const imageInput = document.querySelector('#image-upload');

    const textContent = contentInput.value;
    const imageUrl = imageInput.files[0] ? URL.createObjectURL(imageInput.files[0]) : '';

    if (imageUrl) {
        const selectedLayout = document.querySelector('input[name="layout-option"]:checked').value;
        displayImageWithText(imageUrl, textContent, selectedLayout);
    } else {
        alert('Please upload an image.');
    }
}

function HTML5XBlock(runtime, element, data) {
    document.getElementById("default-tab").click();

    const editor = configureTheEditor(data);

    element.querySelectorAll('.save-button').forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            studioSubmit();
        });
    });

    element.querySelectorAll('.cancel-button').forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            runtime.notify('cancel', {});
        });
    });

    document.querySelector('#image-upload').addEventListener('change', previewImage);
}
