(function (app) {
    var config = {
        colorBlack: 'rgba(0,0,0,0.87)',
        colorGrey: 'rgba(0,0,0,0.44)',
        colorLight: '#fff',
        colorLightGrey: '#c7c7c7',

        colorScale: ['#F44336', '#9C27B0', '#03A9F4', '#8BC34A', '#FFC107', '#646464'],

        sizeLine: 0.8,
        sizePadding: 0.016,
        sizeScale: 1000,
        sizeTile: 24,
        initialized: false
    };

    // title, ?, ?, ?, text overview
    var meta = {
        0: ['Numbers', true, true, false, false],
        1: ['Misc', true, true, false, false],
        2: ['Icons', true, true, false, true],
        3: ['Smileys', false, false, false, true],
        4: ['Animals', false, false, false, true],
        5: ['Food', false, false, false, true],
        6: ['Flags', false, false, false, true],
        7: ['Words', true, true, true, false],
        8: ['Colors', true, true, true, false]
    };

    var options = {
        numCols: 12,
        numSymbols: 57,

        selectDeck: 3,
        selectType: 0,

        switchCircle: true,
        switchInvert: true,
        switchRotate: true,
        switchShuffleSymbols: true,
        switchSize: true,
        switchOverview: true
    };

    function addWordsToSymbols(words, symbols, size, fonts) {
        var child = symbols.firstChild;
        document.body.appendChild(child);
        var g = d3.select(child)
            .append('g')
            .selectAll('g')
            .data(words)
            .enter()
            .append('g')
            .attr('fill', function (d) {
                return d.value;
            });

        g = g
            .append('text')
            .attr('title', function (d) {
                return d.word;
            })
            .attr('x', size / 2)
            .attr('y', size / 2)
            .attr('font-size', size / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle');

        if (fonts) {
            g.attr('font-weight', function () {
                return [null, 'bold'][Math.floor(Math.random() * 2)];
            })
                .attr('font-style', function () {
                    return [null, 'italic'][Math.floor(Math.random() * 2)];
                })
                .attr('font-family', function () {
                    return ['sans-serif', 'serif', 'monospace', 'cursive'/*, 'fantasy'*/][Math.floor(Math.random() * 5)];
                });
        } else {
            g.attr('font-weight', 'bold');
        }

        g
            .selectAll('tspan')
            .data(function (d) {
                return d.word.split(' ');
            })
            .enter()
            .append('tspan')
            .attr('dy', size / 2)
            .attr('x', 0)
            .text(function (d) {
                return d;
            });

        g
            .each(function () {
                var b = this.getBBox();
                var c = getBoundingBoxCircle(b);
                d3.select(this.parentElement)
                    .append('circle')
                    .attr('cx', c.x)
                    .attr('cy', c.y)
                    .attr('r', c.r);
            });

        symbols.appendChild(child);
    }

    function filterColors(colors) {
        colors.sort(function (a, b) {
            var h = (a.hsl.h || 0) - (b.hsl.h || 0);

            return h === 0 ? (a.hsl.l || 0) - (b.hsl.l || 0) : h;
        });

        return colors;
    }

    function run(err, decks, symbols, words, colors, drawOnly) {
        if (err) {
            console.error(err);
            return;
        }

        d3.select('body').attr('class', 'show-cards');

        var width = parseInt(d3.select('.wrap').style('width'));
        var colsRows = getColsRows(decks[options.selectDeck].length, options);
        var cardWidth = options.cardWidth = width / colsRows[0];
        var height = cardWidth * colsRows[1];

        if (!config.initialized) {
            addWordsToSymbols(words, symbols, config.sizeTile, true);
            addWordsToSymbols(filterColors(colors), symbols, config.sizeTile);
            config.initialized = true;
        }

        var symbolSet = options.data = symbols.querySelectorAll('svg > g:nth-child(' + (options.selectType + 1) + ') > g');

        options.switchInvert = meta[options.selectType][2] ? options.switchInvert : false;
        options.text = meta[options.selectType][3];

        var svg = svgInit(width, height);

        app.showCards = function (drawOnly) {
            run(err, decks, symbols, words, colors, drawOnly);
        };

        if (!drawOnly) {
            config.deck = app.getDeck(decks[options.selectDeck], options, config, meta);
        }

        options.simple = meta[options.selectType][1];
        options.background = meta[options.selectType][2];

        svgUpdateCards(svg, cardWidth, options.switchOverview ? config.deck : config.deck.slice(1), colsRows, symbolSet);
    }

    function svgInit(width, height) {
        var svg = d3.select('.wrap')
            .selectAll('svg')
            .data([0]);

        svg = svg
            .enter()
            .append('svg')
            .merge(svg)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('viewBox', '0 0 ' + width + ' ' + height)
            .attr('width', '100%')
            .attr('height', '100%');

        return svg;
    }

    function svgUpdateCards(svg, cardWidth, deck, cr, symbols) {
        var group = svg.selectAll('g').data([0]);
        group = group.enter().append('g').merge(group);

        var cards = group
            .attr('transform', 'scale(' + cardWidth / config.sizeScale + ')')
            .selectAll('g.card,g.overview')
            .data(deck);

        cards.exit().remove();

        cards
            .enter()
            .append('g')
            .merge(cards)
            .attr('class', function (d) {
                return d.overview ? 'overview' : 'card';
            })
            .attr('transform', function (d, i) {
                return 'translate(' + config.sizeScale * (i % cr[0]) + ' ' + config.sizeScale * Math.floor(i / cr[0]) + ')';
            })
            .each(function (d) {
                svgUpdateCard.call(this, d, symbols)
            });
    }

    function svgUpdateCard(d, symbols) {
        d.descendants().forEach(function (d) {
            d.sr = d.r * config.sizeScale;
            d.sx = d.x * config.sizeScale;
            d.sy = d.y * config.sizeScale;
        });

        var card = d3.select(this)
            .selectAll('rect')
            .data([d]);

        card
            .enter()
            .append('rect')
            .merge(card)
            .call(svgUpdateCircle);

        card = d3.select(this)
            .selectAll('g.symbol')
            .data(d.children);

        card.exit().remove();

        var cardEnter = card
            .enter()
            .append('g')
            .classed('symbol', true);

        cardEnter.merge(card).attr('title', function (d) {
            return getText(options.data[d.id]);
        })
            .on('click', click);

        cardEnter.append('rect');
        cardEnter.append('g');

        d3.select(this)
            .selectAll('g.symbol > rect')
            .data(d.children)
            .call(svgUpdateCircle);

        d3.select(this)
            .selectAll('g.symbol > text').remove();

        if (d.overview) {
            if (meta[options.selectType][4]) {
                d3.select(this)
                    .selectAll('g.symbol')
                    .append('text')
                    .each(function (d) {
                        var text = getText(options.data[d.id]);

                        var n = d3.select(this)
                            .attr('fill', config.colorBlack)
                            .attr('font-size', d.sr * 2 / 2.8)
                            .attr('dominant-baseline', 'hanging')
                            .attr('transform', 'translate(' + (d.sx + d.sr * 1.2) + ' ' + (d.sy - d.sr) + ')')
                            .text(text);

                        d.st = d.t * config.sizeScale;
                        svgWrapText(n, d.st - d.sr * 2 * .2, d.sr * 2, d.sr * 2 / 3);
                    });
            }
        }

        card = d3.select(this)
            .selectAll('g.symbol > g')
            .data(d.children)
            .attr('fill', function (d) {
                if (!options.switchInvert && symbols[d.id]) {
                    var x = d3.select(symbols[d.id]).attr('fill');

                    if (x) {
                        return x;
                    }
                }

                return !options.switchInvert && d.data
                    ? options.simple
                        ? d.data.color
                        : null
                    : options.simple
                        ? '#fff'
                        : null;
            })
            .attr('transform', function (d) {
                var s = Math.sqrt(Math.pow(d.sr - (options.switchInvert && !options.text
                            ? (d.overview ? 1 : 2) * config.sizeScale * config.sizePadding
                            : 0), 2) / 2);

                if (d.overview && ((d.sr / s) > 2)) {
                    s = d.sr / 2;
                }

                return 'rotate(' + (options.switchRotate ? d.data.angle : 0) + ' ' + d.sx + ' ' + d.sy + ') translate(' + (d.sx - s) + ' ' + (d.sy - s) + ')' + 'scale(' + 2 * s / 24 + ')'
            });

        card
            .selectAll('*').remove();

        card
            .each(function (d) {
                d3.select(this)
                    .append(function () {
                        var g = symbols[d.id].firstChild.cloneNode(true);

                        if (g.getAttribute('transform')) {
                            return document.createElementNS('http://www.w3.org/2000/svg', 'g').appendChild(g)
                        }

                        return g;
                    })
                    .each(function (d) {
                        var g = d3.select(this.getAttribute('transform') ? this.parentElement : this);
                        var mr = Math.sqrt(2 * Math.pow(24 / 2, 2));
                        var bc = {
                            x: parseFloat(symbols[d.id].children[1].getAttribute('cx')),
                            y: parseFloat(symbols[d.id].children[1].getAttribute('cy')),
                            r: parseFloat(symbols[d.id].children[1].getAttribute('r'))
                        };

                        var s = mr / bc.r;
                        var sx = bc.x + -12 / s;
                        var sy = bc.y + -12 / s;
                        g.attr('transform', (g.attr('transform') || '') + 'scale(' + s + ')' + 'translate(' + (-sx) + ' ' + (-sy) + ')')
                    });
            });
    }

    // https://bl.ocks.org/mbostock/7555321
    function svgWrapText(text, width, height, lineHeight) {
        text.each(function () {
            var text = d3.select(this);
            var words = text.text().split(/\s+/).reverse();
            var word;
            var line = [];
            var lineNumber = 0;
            var tspan = text.text(null)
                .append('tspan')
                .attr('x', 0)
                .attr('y', 0);

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(' '));

                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(' '));
                    line = [word];
                    tspan = text.append('tspan')
                        .attr('x', 0)
                        .attr('y', ++lineNumber * lineHeight)
                        .text(word);
                }
            }

            text.selectAll('tspan').attr('y', function () {
                return parseFloat(d3.select(this).attr('y')) + (height - (lineNumber + 1) * lineHeight) / 2;
            });
        });
    }

    function svgUpdateCircle(selection) {
        selection
            .attr('x', function (d) {
                return d.sx - (2 * d.sr - config.sizeLine / options.cardWidth) / 2;
            })
            .attr('y', function (d) {
                return d.sy - (2 * d.sr - config.sizeLine / options.cardWidth) / 2;
            })
            .attr('width', function (d) {
                return 2 * d.sr - config.sizeLine / options.cardWidth
            })
            .attr('height', function (d) {
                return 2 * d.sr - config.sizeLine / options.cardWidth
            })
            .attr('rx', function (d) {
                return d.depth || (!d.overview && options.switchCircle)
                    ? (2 * d.sr - config.sizeLine / options.cardWidth) / 2
                    : 0;
            })
            .attr('ry', function (d) {
                return d.depth || (!d.overview && options.switchCircle)
                    ? (2 * d.sr - config.sizeLine / options.cardWidth) / 2
                    : 0;
            })
            .attr('fill', function (d) {
                if (options.data[d.id]) {
                    var x = d3.select(options.data[d.id]).attr('fill');
                }

                return options.switchInvert && x
                    ? x
                    : options.switchInvert && d.data
                        ? d.data.color
                        : config.colorLight;
            })
            .attr('stroke', function (d) {
                return !d.depth ? config.colorLightGrey : null;
            })
            .attr('stroke-width', function () {
                return config.sizeScale * config.sizeLine / options.cardWidth;
            });
    }

    function getColsRows(items, options) {
        var cols = options.numCols;
        var rows = Math.ceil(items / cols);
        return [cols, rows];
    }

    function uiRadioValue(name) {
        return d3.selectAll('[name=' + name + ']')
            .filter(function (d) {
                return d3.select(this).property('checked')
            })
            .property('value');
    }

    function uiCheckValue(name) {
        return d3.select('[name=' + name + ']').property('checked');
    }

    function uiParseOptions() {
        options.numCols = uiRadioValue('select-cols');
        options.selectDeck = uiRadioValue('input-deck');
        options.selectType = parseInt(uiRadioValue('input-symbols'));
        options.switchCircle = uiCheckValue('input-circle');
        options.switchInvert = uiCheckValue('input-invert');
        options.switchSize = uiCheckValue('input-size');
        options.switchRotate = uiCheckValue('input-rotation');
        options.switchOverview = uiCheckValue('select-overview');
        options.switchShuffleSymbols = uiCheckValue('input-shuffle');
    }

    function uiStart() {
        d3.queue()
            .defer(d3.json, 'assets/decks.json')
            .defer(d3.xml, 'assets/symbols.svg')
            .defer(d3.csv, 'assets/words.csv')
            .defer(d3.csv, 'assets/colors.csv', getColorRow)
            .await(run);

        function u() {
            setTimeout(function () {
                d3.select('.wrap-print').selectAll('*').remove();
                uiParseOptions();
                app.showCards();
            });
        }

        function v() {
            setTimeout(function () {
                d3.select('.wrap-print').selectAll('*').remove();
                uiParseOptions();
                app.showCards(true);
            });
        }

        d3.select('#button-refresh').on('click', u);
        d3.select('#button-print').on('click', printCard);
        d3.select('#button-save').on('click', uiSaveCards);
        d3.select('#button-game').on('click', function () {
            app.showGame(options, config);
        });
        d3.selectAll('[name*=input]').on('click', u);
        d3.selectAll('[name*=select]').on('click', v);

        d3.selectAll('[name*=game]').on('click', function () {
            options.selectPlayers = parseInt(uiRadioValue('game-players'));
            setTimeout(function () {
                app.showGame(options, config);
            });
        });

        window.addEventListener('optimizedResize', resizeCards);
    }

    function getColorRow(d) {
        d.word = d.color.replace(/([a-z])([A-Z])/g, '$1 $2');
        d.value = d3.color(d.color);
        d.hsl = d3.cubehelix(d.color);
        return d;
    }

    function getBoundingBoxCircle(b) {
        var cs = [
            {
                x: b.x,
                y: b.y,
                r: 0
            }, {
                x: b.x + b.width,
                y: b.y,
                r: 0
            }, {
                x: b.x,
                y: b.y + b.height,
                r: 0
            }, {
                x: b.x + b.width,
                y: b.y + b.height,
                r: 0
            }
        ];

        return d3.packEnclose(cs)
    }

    function printCard() {
        var b = d3.select('.wrap-print');
        b.selectAll('*').remove();

        d3.select('svg').selectAll('svg > g > g').each(function () {
            var n = this.cloneNode(true);
            d3.select(n).attr('transform', null);
            b.append('svg')
                .attr('width', (100 / options.numCols) + '%')
                .attr('viewBox', '0 0 ' + config.sizeScale + ' ' + config.sizeScale).node().appendChild(n);
        });

        window.print();
    }

    function getText(g) {
        var t = g.querySelector('text');
        return t.getAttribute('title') || t.textContent;
    }

    function click(d) {
        if (d.id >= 0) {
            var text = getText(options.data[d.id]);
            app.utilSpeak(text);
        }
    }

    function uiSaveCards() {
        utilSaveFile(d3.select('.page-cards svg').node().outerHTML, 'cards.svg');
    }

    function utilSaveFile(data, filename) {
        if (!filename) filename = 'console.json';

        var blob = new Blob([data], {type: 'text/json'}),
            e = document.createEvent('MouseEvents'),
            a = document.createElement('a');

        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e)
    }

    function resizeCards() {
        if (!d3.select('body.show-cards').node()) {
            return;
        }

        if (app.showCards) {
            app.showCards(true);
        }
    }

    app.showCards = null;
    uiStart();
})(window.app = window.app || {});
