# Kashida HTML Layout XBlock

[![build](https://circleci.com/gh/open-craft/xblock-html/tree/master.svg?style=shield)](https://circleci.com/gh/open-craft/xblock-html/tree/master) [![codecov](https://codecov.io/gh/open-craft/xblock-html/branch/master/graph/badge.svg)](https://codecov.io/gh/open-craft/xblock-html)

The Kashida HTML Layout XBlock allows users to select predefined layout templates and then customize them by adding images, text, and other content. This XBlock aims to enhance course content by providing flexible, visually appealing layouts for embedding media and text.

## Introduction
The Kashida HTML Layout XBlock enables course authors to create rich and interactive content using predefined layout templates. Users can choose a template (e.g., text on the left and image on the right, or vice versa) and then customize the content directly in the template fields.

### Key Features
- Predefined layout templates to choose from.
- Customizable content fields (e.g., images, text).
- Enhanced user experience with visually structured content.
- Secure and easy-to-use, following best practices for embedding HTML content.

## Installation
You may install the Kashida HTML Layout XBlock using its `setup.py`, or if you prefer to use pip, run:

```shell
pip install https://github.com/msscompany1/xblock-kashida-html-layouts.git
```
You may specify the `-e` flag if you intend to develop on the repo.

Note that as of version 1.0.0, Python 2.7 is no longer supported. The current minimum Python version is 3.8.

To enable this block, add `"kashida_html_layout"` to the course's advanced module list. The option will then appear in the advanced components.

## Usage
Once the Kashida HTML Layout XBlock is added to your course, instructors can select a layout template from the settings. After selecting a template, they can fill in the layout's predefined fields, such as:

- **Image on the left, text on the right**
- **Text on the left, image on the right**
- Other customizable templates as needed

This flexibility allows course authors to create dynamic and engaging content easily.

## Configuration
To customize the look and feel of the layouts, you can add CSS classes to your deployment's theming requirements by modifying the `XBLOCK_SETTINGS` part of the CMS/Studio configuration:

```python
XBLOCK_SETTINGS = {
    "kashida_html_layout": {
        "custom_classes": ["your-list", "of-css", "classes"]
    }
}
```

These classes will be available for further styling based on your needs.

## Development
If you're willing to develop on this repo, you need to be familiar with different technologies and the repo's dependencies. However, to make things easier to set up and manage, there are several `make` commands that you can use to do things faster.

### Setting the requirements up
Running the following command will install in your Python environment all the requirements you need for this project:

```shell
$ make requirements
```

### Running tests
Tests are essential for this project to ensure all features work as expected. To check your changes, you can use:

```shell
$ make test
```
Or if you want to check the code quality only, run:

```shell
$ make quality
```

