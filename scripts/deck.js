(function (app) {
    function getDeck(deck, options, config, meta) {
        var colorScale = getExtendedScale(config.colorScale, Math.max(config.colorScale.length, deck[0].length + 1));
        var color = d3.scaleOrdinal(colorScale);
        var normal = d3.randomNormal();
        var uniform = d3.randomUniform(0, options.switchRotate ? 360 : 0);
        var ids = d3.range(options.numSymbols);
        ids = options.switchShuffleSymbols ? d3.shuffle(ids) : ids;
        ids = ids.slice(0, deck.length);

        if (options.switchCircle) {
            var cards = deck.map(function (d) {
                var root;
                var fi = 0;
                var i = 0;

                while (fi < 0.5 && i < 3) {
                    i++;
                    root = getLayout(d, ids, normal, uniform, colorScale, color, options);
                    d3.pack().padding(config.sizePadding)(root);
                    fi = options.switchSize ? getCirclesArea(root.children) / getCirclesArea([root]) : 1;
                }

                return root;
            });
        } else {
            cards = deck.map(function (d) {
                var root = getLayout(d, ids, normal, uniform, colorScale, color, options);
                d3.treemap().tile(d3.treemapResquarify.ratio(1)).padding(config.sizePadding)(root);

                root.descendants().forEach(function (d) {
                    d.x = d.x0 + (d.x1 - d.x0) / 2;
                    d.y = d.y0 + (d.y1 - d.y0) / 2;
                    d.r = Math.min(d.x1 - d.x0, d.y1 - d.y0) / 2;

                    if ((d.x1 - d.x0) < (d.y1 - d.y0)) {
                        var sh = ((d.y1 - d.y0) - 2 * d.r) / 2;
                        d.y += d3.randomUniform(-sh, sh)();
                    } else {
                        sh = ((d.x1 - d.x0) - 2 * d.r) / 2;
                        d.x += d3.randomUniform(-sh, sh)();
                    }
                });

                return root;
            });
        }

        cards.unshift(getOverview(ids, color, colorScale, meta, options, config));

        return cards;
    }

    function getLayout(card, ids, normal, uniform, colorScale, color, options) {
        var table = d3.merge([[null], card.map(function (d) {
            return {
                id: ids[d],
                value: options.switchSize ? Math.min(Math.max(Math.abs(normal()), 0.5), 1) : 1,
                color: color(d % colorScale.length),
                angle: uniform()
            }
        })]);

        var root = d3.stratify()
            .id(function (d) {
                return !d ? -1 : d.id;
            })
            .parentId(function (d) {
                return !d ? null : -1;
            })
            (options.switchShuffleSymbols ? d3.shuffle(table) : table);

        root.sum(function (d) {
            return d ? d.value : 0;
        });

        return root;
    }

    function getCirclesArea(list) {
        var sum = 0;

        list.forEach(function (d) {
            sum += Math.PI * Math.pow(d.r, 2);
        });

        return sum;
    }

    function getOverview(ids, color, colorScale, meta, options, config) {
        var order = ids.map(function (d) {
            return d;
        });

        order.sort(function (a, b) {
            return a - b;
        });

        var text = meta[options.selectType][4];
        var maxRows = 12;
        var maxCols = 4;
        var cols = !text ? Math.ceil(Math.sqrt(ids.length)) : Math.min(maxCols, Math.ceil(ids.length / maxRows));
        var rows = Math.ceil(ids.length / cols);
        var root = {
            x: 0.5,
            y: 0.5,
            r: 0.5,
            overview: true,
            descendants: function () {
                return d3.merge([[root], root.children]);
            }
        };

        var margin = config.sizePadding;

        var pos = d3.scaleLinear()
            .domain([0, 1])
            .range([margin, 1 - margin]);

        var scale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, 1 - 2 * margin]);

        root.children = ids.map(function (d, i) {
            var o = order.indexOf(d);
            var r = !text ? 0.5 / rows : 0.5 / rows;

            return {
                data: {
                    id: d,
                    color: color(i % colorScale.length),
                    angle: 0
                },
                x: pos(!text
                    ? r + (o % cols) / cols
                    : r + Math.floor(o / rows) / cols),
                y: pos(!text
                    ? r + Math.floor(o / cols) / rows
                    : r + (o % rows) / rows),
                r: scale(r),
                t: scale(1 / cols - 2 * r),
                overview: true,
                depth: 1,
                id: d
            };
        });

        return root;
    }


    function getExtendedScale(original, target) {
        var fixed = [];

        for (var i = 0; i < target; i++) {
            fixed.push(original[i % original.length]);
        }

        return fixed;
    }

    app.getDeck = getDeck;
})(window.app = window.app || {});