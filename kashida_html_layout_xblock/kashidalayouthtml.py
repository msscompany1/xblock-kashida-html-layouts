"""This XBlock help creating a secure and easy-to-use HTML blocks in edx-platform."""

import logging

import pkg_resources
from django.conf import settings
from web_fragments.fragment import Fragment
from xblock.completable import XBlockCompletionMode
from xblock.core import XBlock
from xblock.fields import Boolean, Scope, String
from xblockutils.resources import ResourceLoader
from xblockutils.studio_editable import StudioEditableXBlockMixin, loader

from .bleaching import SanitizedText
from .utils import _

log = logging.getLogger(__name__)
xblock_loader = ResourceLoader(__name__)


@XBlock.wants('settings')
class KashidaHTMLLayoutXBlock(StudioEditableXBlockMixin, XBlock):
    """
    This XBlock will provide an HTML WYSIWYG interface in Studio to be rendered in LMS.
    """

    display_name = String(
        display_name=_('Display Name'),
        help=_('The display name for this component.'),
        scope=Scope.settings,
        default=_('kashida HTML Layouts')
    )
    data = String(help=_('Choose the layout for displaying content'), default='', scope=Scope.content)
    layout = String(
        display_name="Layout",
        help=_("Choose a predefined layout to display your content."),
        values=[
                {"value": "left_right", "display_name": "Left Text, Right Image"},
                {"value": "top_bottom", "display_name": "Top Image, Bottom Text"},
                {"value": "side_by_side", "display_name": "Side by Side"},
            ],
            default="left_right",
            scope=Scope.settings
    )

    data = String(
        help=_('Html contents to display for this module'),
        default='',
        scope=Scope.content
    )
    editor = String(
        help=_(
            'Select Visual to enter content and have the editor automatically create the HTML. Select Raw to edit '
            'HTML directly. If you change this setting, you must save the component and then re-open it for editing.'
        ),
        display_name=_('Editor'),
        default='visual',
        values=[
            {'display_name': _('Visual'), 'value': 'visual'},
            {'display_name': _('Raw'), 'value': 'raw'}
        ],
        scope=Scope.settings
    )
    editable_fields = ('display_name', 'editor', 'layout')
    block_settings_key = "html5"

    def get_settings(self):
        """
        Get the XBlock settings bucket via the SettingsService.
        """
        settings_service = self.runtime.service(self, 'settings')
        if settings_service:
            return settings_service.get_settings_bucket(self)

        return {}

    @staticmethod
    def resource_string(path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode('utf8')

    @XBlock.supports('multi_device')
    def student_view(self, context=None):  # pylint: disable=unused-argument
        """
        Return a fragment that contains the html for the student view.
        """
        frag = Fragment()
        frag.content = xblock_loader.render_django_template('static/html/lms.html', {'self': self})

        frag.add_css(self.resource_string('public/plugins/codesample/css/prism.css'))
        frag.add_javascript(self.resource_string('public/plugins/codesample/js/prism.js'))

        if getattr(self.runtime, 'is_author_mode', False):
            frag.add_css(self.resource_string('static/css/html_preview.css'))

        return frag

    def studio_view(self, context=None):
        """
        Return a fragment that contains the html for the Studio view.
        """
        frag = Fragment()

        settings_fields = self.get_editable_fields()
        settings_page = loader.render_django_template('templates/studio_edit.html', {'fields': settings_fields})
        context = {
            'self': self,
            'settings_page': settings_page,
        }

        frag.content = xblock_loader.render_django_template('static/html/studio.html', context)

        self.add_edit_stylesheets(frag)
        self.add_edit_scripts(frag)

        js_data = {
            'editor': self.editor,
            'script_url': settings.STATIC_URL + 'js/vendor/tinymce/js/tinymce/tinymce.full.min.js',
            'skin_url': settings.STATIC_URL + 'js/vendor/tinymce/js/tinymce/skins/ui/studio-tmce5',
            'codemirror_path': settings.STATIC_URL + 'js/vendor/',
            'external_plugins': self.get_editor_plugins(),
            'table_custom_classes': self.get_settings().get("table_custom_classes", [])
        }
        frag.initialize_js('KashidaHTMLLayoutXBlock', js_data)

        return frag

    @XBlock.json_handler
    def update_content(self, data, suffix=''):
        """
        Update the saved HTML data with the new HTML passed in the JSON 'content' field,
        including the predefined layout with text content and image URL.
        """
        self.text_content = data.get('text_content', '')
        self.image_url = data.get('image_url', '')
        self.layout = data.get('layout', 'left_right')

        return {
            'text_content': self.text_content,
            'image_url': self.image_url,
            'layout': self.layout
        }

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ('HTML5XBlock - Default Layout',
            """<html5/>
            """),
            ('HTML5XBlock - Text Left, Image Right',
            """<html5
                    layout="text-left-image-right"
                    data='{"text": "This is some text on the left.", "image": "path/to/image1.jpg"}'
                />
            """),
            ('HTML5XBlock - Image Left, Text Right',
            """<html5
                    layout="image-left-text-right"
                    data='{"text": "This is some text on the right.", "image": "path/to/image2.jpg"}'
                />
            """),
            ('HTML5XBlock - Text Above, Image Below',
            """<html5
                    layout="text-above-image-below"
                    data='{"text": "This is some text above the image.", "image": "path/to/image3.jpg"}'
                />
            """),
            ('HTML5XBlock - Multiple Layouts',
            """<vertical_demo>
                <html5 layout="text-left-image-right" data='{"text": "Text on the left.", "image": "path/to/image4.jpg"}'/>
                <html5 layout="image-left-text-right" data='{"text": "Text on the right.", "image": "path/to/image5.jpg"}'/>
                <html5 layout="text-above-image-below" data='{"text": "Text above the image.", "image": "path/to/image6.jpg"}'/>
                </vertical_demo>
            """),
        ]

    def add_edit_stylesheets(self, frag):
        """
        A helper method to add all styles to the fragment necesesary for edit.
        :param frag: The fragment that will hold the scripts.
        """
        frag.add_css(self.resource_string('static/css/html_edit.css'))

        if self.editor == 'raw':
            frag.add_css_url(settings.STATIC_URL + 'js/vendor/CodeMirror/codemirror.css')

    def add_edit_scripts(self, frag):
        """
        A helper method to add all scripts to the fragment necessary for edit.
        :param frag: The fragment that will hold the scripts.
        """
        frag.add_javascript_url(settings.STATIC_URL + 'js/vendor/tinymce/js/tinymce/tinymce.full.min.js')
        frag.add_javascript_url(settings.STATIC_URL + 'js/vendor/tinymce/js/tinymce/themes/silver/theme.min.js')
        frag.add_javascript(self.resource_string('static/js/html_edit.js'))
        frag.add_javascript(loader.load_unicode('public/studio_edit.js'))

        if self.editor == 'raw':
            frag.add_javascript_url(settings.STATIC_URL + 'js/vendor/CodeMirror/codemirror.js')
            frag.add_javascript_url(settings.STATIC_URL + 'js/vendor/CodeMirror/addons/xml.js')

    @staticmethod
    def get_editor_plugins():
        """
        This method will generate a list of external plugins urls to be used in TinyMCE editor.
        These plugins should live in `public` directory for us to generate URLs for.

        :return: A list of URLs
        """
        plugin_path = 'plugins/{plugin}/plugin.min.js'
        plugins = ['codesample', 'image', 'link', 'lists', 'codemirror', 'table']

        return {
            plugin: (
                settings.STATIC_URL + "js/vendor/tinymce/js/tinymce/" +
                plugin_path.format(plugin=plugin)
            ) for plugin in plugins
        }

    def substitute_keywords(self):
        """
        Replaces all %%-encoded words using KEYWORD_FUNCTION_MAP mapping functions.

        Iterates through all keywords that must be substituted and replaces them by calling the corresponding functions
        stored in `keywords`. If the function throws a specified exception, the substitution is not performed.

        Functions stored in `keywords` must either:
            - return a replacement string
            - throw `KeyError` or `AttributeError`, `TypeError`.
        """
        data = self.data
        runtime = getattr(self, 'runtime', None)
        if not runtime:  # This shouldn't happen, but if `runtime` is missing, then skip substituting keywords.
            return data

        keywords = {
            '%%USER_ID%%': lambda: runtime.anonymous_student_id,
            '%%COURSE_ID%%': lambda: runtime.course_id.html_id(),  # pylint: disable=unnecessary-lambda
        }

        for key, substitutor in keywords.items():
            if key in data:
                try:
                    data = data.replace(key, substitutor())
                except (KeyError, AttributeError, TypeError):
                    # Do not replace the keyword when substitutor is not present.
                    pass

        return data

    @property
    def html(self):
        """
        A property that returns this module's content data with layout rendering applied.
        Substitutes keywords and includes layout-specific wrapping if applicable.
        """
        # Get substituted data
        data = self.substitute_keywords()
        
        # Apply layout-specific HTML structure
        if self.layout == "left_right":
            html = f"""
            <div class="layout-left-right">
                <div class="text-left">{SanitizedText(data)}</div>
                <div class="image-right"><img src="path/to/image.jpg" alt="Right Image"></div>
            </div>
            """
        elif self.layout == "top_bottom":
            html = f"""
            <div class="layout-top-bottom">
                <div class="image-top"><img src="path/to/image.jpg" alt="Top Image"></div>
                <div class="text-bottom">{SanitizedText(data)}</div>
            </div>
            """
        elif self.layout == "side_by_side":
            html = f"""
            <div class="layout-side-by-side">
                <div class="content-side">{SanitizedText(data)}</div>
            </div>
            """
        else:
            # Default to plain sanitized content
            html = SanitizedText(data)
            return html

    def get_editable_fields(self):
        """
        This method extracts the editable fields from this XBlock and returns them after validating them.

        Part of this method's copied from StudioEditableXBlockMixin#submit_studio_edits
        with some modifications..
        :return: A list of the editable fields with the information that
                the template needs to render a form field for them.

        """
        fields = []

        # Build a list of all the fields that can be edited:
        for field_name in self.editable_fields:
            field = self.fields[field_name]  # pylint: disable=unsubscriptable-object
            assert field.scope in (Scope.content, Scope.settings), (
                'Only Scope.content or Scope.settings fields can be used with '
                'StudioEditableXBlockMixin. Other scopes are for user-specific data and are '
                'not generally created/configured by content authors in Studio.'
            )
            field_info = self._make_field_info(field_name, field)
            if field_info is not None:
                fields.append(field_info)

        return fields


class ExcludedHTML5XBlock(KashidaHTMLLayoutXBlock):
    """
    This XBlock is excluded from the completion calculations.
    """

    display_name = String(
        display_name=_('Display Name'),
        help=_('The display name for this component.'),
        scope=Scope.settings,
        default=_('Exclusion')
    )
    editor = String(
        help=_(
            'Select Visual to enter content and have the editor automatically create the HTML. Select Raw to edit '
            'HTML directly. If you change this setting, you must save the component and then re-open it for editing.'
        ),
        display_name=_('Editor'),
        default='raw',
        values=[
            {'display_name': _('Visual'), 'value': 'visual'},
            {'display_name': _('Raw'), 'value': 'raw'}
        ],
        scope=Scope.settings
    )
    has_custom_completion = True
    completion_mode = XBlockCompletionMode.EXCLUDED