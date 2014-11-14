# &lt;potv-network-channel&gt;

> is a Polymer Custom Element to visualize networking of packages.
	 	Package could be represented by any HTML Element. `<potv-network-channel>` aligns them in a line, shows a button, and gives API to `.transfer(elementIndex)` the element over the wire. 
	 	Transfer method, and `transferred` DOM Event gives the pointer to transferred (detached from DOM) Element co it could be appended to another `<potv-network-channel>`.

## Demo

[Check it live!](http://tomalec.github.io/potv-network-channel)

## Install

Install the component using [Bower](http://bower.io/):

```sh
$ bower install potv-network-channel --save
```

Or [download as ZIP](https://github.com/tomalec/potv-network-channel/archive/gh-pages.zip).

## Usage

1. Import Web Components' polyfill:

    ```html
    <script src="bower_components/platform/platform.js"></script>
    ```

2. Import Custom Element:

    ```html
    <link rel="import" href="bower_components/potv-network-channel/src/potv-network-channel.html">
    ```

3. Start using it!

    ```html
    <potv-network-channel></potv-network-channel>
    ```

## Options

Attribute     | Options            | Default      | Description
---           | ---                | ---          | ---
`direction`   | `"up"` \| `"down"` \ | `"left"` \| `"right"` | `down`       | Direction of packages flow

## Methods

Method        | Parameters                                             | Returns              | Description
---           | ---                                                    | ---                  | ---
`transfer()`  |   *{Number\|Element}* **index_or_child** (_default_ 0) | "Transfered" Element | Transfers child element of given index, or given child element.

## Events

Event         | `.detail`                      | Description
---           | ---                            | ---
`transferred` | `{"package": detachedElement}` | Triggers when element gets transferred.


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

For detailed changelog, check [Releases](https://github.com/tomalec/potv-network-channel/releases).

## License

[MIT License](http://opensource.org/licenses/MIT)
