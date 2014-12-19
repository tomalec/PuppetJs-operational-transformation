# &lt;juicy-diamond-graph&gt;

> Polymer Custom Element to build diamond diagrams, useful to visualize [Operational Transformation](http://en.wikipedia.org/wiki/Operational_transformation) flow

## Demo

[Check it live!](http://Juicy.github.io/juicy-diamond-graph)

## Install

Install the component using [Bower](http://bower.io/):

```sh
$ bower install juicy-diamond-graph --save
```

Or [download as ZIP](https://github.com/Juicy/juicy-diamond-graph/archive/master.zip).

## Usage

1. Import Web Components' polyfill:

    ```html
    <script src="bower_components/platform/platform.js"></script>
    ```

2. Import Custom Element:

    ```html
    <link rel="import" href="bower_components/juicy-diamond-graph/src/juicy-diamond-graph.html">
    ```

3. Start using it!

    ```html
    <juicy-diamond-graph></juicy-diamond-graph>
    ```

## Attributes & Properites

Attribute | Options         | Default | Description
---       | ---             | ---     | ---
`edges`   | *array{object}* | `[]`    | Array of DiamondEdge objects. 


## Methods

Method            | Parameters   | Returns | Description
---               | ---          | ---     | ---
`goRightClient`   | None.        | self    | Move Client to the right - new Client version
`goRightServer`   | None.        | self    | Move Server to the right - server sync with Client
`goLeft`          | None.        | self    | Move to the left - new Server version comes to the Client
`goLeftClient`    | None.        | self    | Move Client to the left
`goLeftServer`    | None.        | self    | Move Server to the left
`drawEdge`        | from, direction[, length[, dashed[, stroke]]] | self | Draw given edge


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

For detailed changelog, check [Releases](https://github.com/Juicy/juicy-diamond-graph/releases).

## License

[MIT License](http://opensource.org/licenses/MIT)
