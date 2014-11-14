# &lt;juicy-markdown&gt;

> Polymer Element with GitHub Flavored Markdown (GFM) viewer

## Demo

[Check it live!](http://Juicy.github.io/juicy-markdown)

## Install

Install the component using [Bower](http://bower.io/):

```sh
$ bower install juicy-markdown --save
```

Or [download as ZIP](https://github.com/Juicy/juicy-markdown/archive/gh-pages.zip).

## Usage

1. Import Web Components' polyfill:

    ```html
    <script src="bower_components/platform/platform.js"></script>
    ```

2. Import Custom Element:

    ```html
    <link rel="import" href="bower_components/juicy-markdown/juicy-markdown.html">
    ```

3. Start using it!

    ```html
    <my-element value="# Markdown here"></my-element>
    ```

## Options

Attribute | Options  | Default | Description
---       | ---      | ---     | ---
`value`   | *string* | ``      | Markdown to render.
`ghcss`   | *boolean* | `false` | Should ghithub-markdown.css be imported?


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

For detailed changelog, check [Releases](https://github.com/my-user/my-repo/releases).
