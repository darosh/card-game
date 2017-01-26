(function (app) {
    var options;
    var config;
    var players;
    var cards;
    var cardWidth;
    var s;
    var x;
    var y;
    var margin = 46;
    var fontSize = 26;
    var svg;
    var svgCards;
    var texts;
    var timerSelection;
    var hintSelection;
    var id = 0;
    var collapseIcon = 'M1.325,36.209L5.78,40.66c1.134,1.135,1.576,1.105,2.679,0l5.691-5.684l5.35,5.354V22.5H1.655l5.359,5.346l-5.689,5.688 C0.241,34.615,0.209,35.098,1.325,36.209z M39.676,6.79l-4.455-4.451c-1.134-1.134-1.576-1.104-2.679,0l-5.69,5.685L21.5,2.669 v17.83h17.846l-5.359-5.347l5.689-5.685C40.76,8.385,40.789,7.902,39.676,6.79z';
    var iconSize = 42;
    var speed = 400;

    function showGame(gameOptions, gameConfig) {
        options = options || gameOptions;
        config = config || gameConfig;
        d3.select('body').attr('class', 'show-game');
        d3.select('#button-full-screen').on('click', fullScreenGame);
        d3.select('#button-cards').on('click', showCards);
        d3.select('#button-restart').on('click', showGame);
        window.addEventListener('optimizedResize', resizeGame);

        initModel();
        initView();

        for (var i = 1; i < players.length; i++) {
            cardMove(cards[cards.length - i].node, players[i]);
            players[0].c--;
        }

        updateText();
        timer();
    }

    function showCards() {
        fullScreenGame(true);
        players = null;
        app.showCards(true);
    }

    function resizeGame() {
        if (!d3.select('body.show-game').node()) {
            return;
        }

        setTimeout(initView);
    }

    function initView() {
        var width = window.innerWidth;
        var form = 0;
        var formEl = d3.select('.page-game .form');

        if (app.utilIsFullScreen()) {
            formEl.style('display', 'none');
        } else {
            formEl.style('display', null);
            form = parseFloat(formEl.style('height')) + 0;
        }

        var height = window.innerHeight - form;

        if (width < height) {
            var tempHeight = height;
            height = width;
            width = tempHeight;
        }

        players.forEach(function (d) {
            if (isNaN(d.oX)) {
                d.oX = d.x;
                d.oY = d.y;

                if (!d.id) {
                    d.oG = d.g;
                }
            }

            if (tempHeight) {
                d.x = d.oY;
                d.y = d.oX;

                if (!d.id) {
                    d.g = [d.oG[1], d.oG[0]];
                }
            } else {
                d.x = d.oX;
                d.y = d.oY;

                if (!d.id) {
                    d.g = [d.oG[0], d.oG[1]];
                }
            }
        });

        var g = players[0].g;

        cardWidth = Math.min(width / g[0], (height - fontSize * (g[1] === 1 ? 2 : g[1])) / g[1]);

        if (tempHeight) {
            width = height;
            height = tempHeight;
            cardWidth = Math.min(width / g[0], (height - fontSize - fontSize * (g[1] === 1 ? 2 : g[1])) / g[1]);
        } else {
            cardWidth = Math.min(width / g[0], (height - fontSize * (g[1] === 1 ? 2 : g[1])) / g[1]);
        }


        s = cardWidth / config.sizeScale;
        x = d3.scaleLinear().domain([0, 1]).range([0, (width - cardWidth)]);
        y = d3.scaleLinear().domain([0, 1]).range([fontSize, (height - cardWidth - (g[1] === 1 ? fontSize : 0))]);

        svg = svg || d3.select('.page-game.board')
                .append('svg');

        svg
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', '0 0 ' + width + ' ' + height);

        var fulls = svg.selectAll('.collapse').data(app.utilIsFullScreen() ? [players[0]] : []);
        fulls.exit().remove();

        var fullsEnter = fulls.enter()
            .append('g')
            .classed('collapse', true)
            .on('click', function () {
                fullScreenGame(true);
            });

        fullsEnter
            .merge(fulls)
            .attr('transform', function (d) {
                var shift = players.length === 2 ? ((margin * 0.5) / 2) : (margin * 0.5);
                return 'translate(' + (x(d.x) + cardWidth - shift) + ' ' + (y(d.y) - fontSize) + ')'
                    + 'scale(' + ((margin * 0.5) / iconSize) + ')'
            });

        fullsEnter
            .append('rect')
            .attr('width', margin)
            .attr('height', margin)
            .attr('fill', '#fff');

        fullsEnter
            .append('path')
            .attr('d', collapseIcon)
            .attr('fill', config.colorBlack);

        initTexts();

        svgCards = svgCards || svg.append('g');

        svg.node().appendChild(svgCards.node());

        var viewCards = svgCards.selectAll('.card')
            .data(cards, function (d) {
                return d.id;
            });

        viewCards.exit().remove();

        viewCards.enter()
            .append(function (d) {
                return d.node;
            })
            .merge(viewCards)
            .style('display', function (d) {
                return d.show ? null : 'none';
            })
            .attr('transform', function (d) {
                return 'translate(' + x(d.player.x) + ' ' + y(d.player.y) + ')'
                    + 'scale(' + s + ')';
            })
            .selectAll('rect')
            .attr('stroke-width', function () {
                return config.sizeScale * config.sizeLine / cardWidth;
            });

        if (!players[0].c) {
            finish(true);
        }
    }

    function initTexts() {
        var padding = margin * 0.1;

        texts = svg.selectAll('text.info')
            .data(players);

        texts.exit().remove();

        texts = texts.enter()
            .append('text')
            .attr('class', 'info')
            .attr('fill', config.colorBlack)
            .attr('text-anchor', 'middle')
            .merge(texts)
            .attr('dominant-baseline', 'baseline')
            .attr('font-size', margin * 0.5 - padding)
            .attr('transform', function (d) {
                return 'translate(' + (x(d.x) + cardWidth / 2) + ' ' + (y(d.y) - padding) + ')'
            });

        var notes = svg.selectAll('text.note')
            .data([players[0], players[0]]);

        notes = notes.enter()
            .append('text')
            .attr('class', 'note')
            .attr('text-anchor', 'middle')
            .attr('fill', config.colorBlack)
            .merge(notes)
            .attr('font-size', margin * 0.5 - padding)
            .attr('dominant-baseline', 'hanging')
            .attr('transform', function (d) {
                return 'translate(' + (x(d.x) + cardWidth / 2) + ' ' + (y(d.y) + cardWidth + padding) + ')'
            });

        timerSelection = notes
            .filter(function (d, i) {
                return !i;
            })
            .attr('class', 'note timer');

        hintSelection = notes.filter(function (d, i) {
            return i;
        });
    }

    function initModel() {
        var numPlayers = options.selectPlayers || 1;
        players = gameLayout(numPlayers);
        id++;

        cards = Array.prototype.slice.call(document.querySelectorAll('.page-cards .wrap .card')).map(function (d, i) {
            return {
                node: d.cloneNode(true),
                card: config.deck[i + 1],
                player: players[0],
                show: false,
                id: id + '-' + i
            }
        });

        cards = d3.shuffle(cards);
        players[0].c = cards.length;
        players[0].start = new Date();
    }

    function fullScreenGame(off) {
        app.utilFullScreen(d3.select('.page-game').node(), off);
    }

    function timer() {
        if (!players) {
            return;
        }

        var end = (players[0].end ? players[0].end : new Date());
        var diff = end - players[0].start;

        var hours = Math.floor((end - players[0].start) / (1000 * 60 * 60));

        timerSelection
            .text(function () {
                var r;

                if (hours) {
                    r = hours + d3.timeFormat(':%M:%S')(diff)
                } else {
                    r = d3.timeFormat('%M:%S')(diff)
                }

                if (players[0].end) {
                    r += d3.timeFormat('.%L')(diff);
                }

                return r;
            });

        if (!players[0].end) {
            timerSelection
                .transition()
                .duration(1000)
                .on('end', timer);
        }
    }

    function updateText() {
        texts
            .text(function (d) {
                if (!d.id) {
                    return d.c || '';
                } else {
                    if (!d.c && !d.e) {
                        return 'Player ' + d.id;
                    } else {
                        return (d.c || '0') + (d.e ? ' − ' + d.e + ' = ' + ((d.c || 0) - d.e).toString().replace('-', '−') : '');
                    }
                }
            });

        var info = players[0].last;
        players[0].last = '';

        if (!info) {
            return;
        }

        timerSelection.style('display', 'none');

        hintSelection
            .text(info)
            .style('display', null)
            .transition()
            .delay(3000)
            .duration(0)
            .style('display', 'none')
            .on('end', function () {
                timerSelection.style('display', null);
            });
    }

    function cardMove(cardElement, target, moved) {
        d3.select(cardElement.previousSibling)
            .style('display', null)
            .classed('main', true)
            .each(function (d) {
                d.show = true;
            });

        var cardSelection = d3.select(cardElement)
            .style('display', null)
            .classed('player-' + target.id, true)
            .classed('main', false)
            .each(function (d) {
                d.player = target;
                d.show = true;
            });

        cardElement.parentElement.appendChild(cardElement);

        var drag = d3.drag().on('end', clicked);

        cardSelection
            .selectAll('.symbol')
            .call(drag);

        cardSelection
            .transition()
            .ease(d3.easeCubicOut)
            .duration(speed)
            .attr('transform', function () {
                return 'translate(' + x(target.x) + ' ' + y(target.y) + ')'
                    + 'scale(' + s + ')';
            })
            .on('end', function () {
                d3.select('.active' + '.player-' + target.id)
                    .style('display', 'none')
                    .classed('active', false)
                    .selectAll('.symbol')
                    .call(d3.drag().on('start', null));

                d3.select(this)
                    .classed('active', true);

                if (moved) {
                    moved();
                }
            });

        function clicked() {
            if (d3.select(this).classed('clicked')) {
                return;
            }

            var title = d3.select(this).attr('title');
            var mainSymbol = svg.select('.card.main .symbol[title="' + title + '"]');

            if (mainSymbol.node()) {
                d3.select(this).classed('clicked', true);
                target.c = target.c || 0;
                target.c++;
                players[0].c--;
                players[0].last = /*'#' + target.id + ': ' + */title;

                cardMove(d3.select('.main').node(), target, function () {
                    app.utilSpeak(title, (target.id - 1) / (players.length - 1));
                });

                if (!players[0].c) {
                    players[0].end = new Date();
                    timer();
                    updateText();
                    finish();
                } else {
                    updateText();
                }
            } else {
                target.e = target.e || 0;
                target.e++;
                updateText();
            }
        }
    }

    function finish(resizeOnly) {
        svg.selectAll('.card')
            .style('display', 'none');

        timerSelection.style('display', null);

        var selection = svg.selectAll('.info,.timer');

        if (!resizeOnly) {
            selection = selection.transition();
        }

        selection
            .attr('font-size', margin)
            .attr('dominant-baseline', 'middle')
            .attr('transform', function (d) {
                return 'translate(' + (x(d.x) + cardWidth / 2) + ' ' + (y(d.y) + cardWidth / 2) + ')'
            });
    }

    function gameLayout(numPlayers) {
        var layout = {
            1: [
                {
                    x: 0,
                    y: 0.5,
                    id: 0,
                    w: function (w, h) {
                        return Math.min(w / 2, h);
                    },
                    g: [2, 1]
                },
                {
                    x: 1,
                    y: 0.5,
                    id: 1
                }
            ],
            2: [
                {
                    x: 0.5,
                    y: 0.5,
                    id: 0,
                    w: function (w, h) {
                        return Math.min(w / 3, h);
                    },
                    g: [3, 1]
                },
                {
                    x: 0,
                    y: 0.5,
                    id: 1
                },
                {
                    x: 1,
                    y: 0.5,
                    id: 2
                }
            ],
            3: [
                {
                    x: 0.5,
                    y: 0.5,
                    id: 0,
                    w: function (w, h) {
                        return Math.min(w / 3, h / 2);
                    },
                    g: [3, 2]
                },
                {
                    x: 0,
                    y: 0,
                    id: 1
                },
                {
                    x: 1,
                    y: 0.5,
                    id: 2
                },
                {
                    x: 0,
                    y: 1,
                    id: 3
                }
            ],
            4: [
                {
                    x: 0.5,
                    y: 0.5,
                    id: 0,
                    w: function (w, h) {
                        return Math.min(w / 3, h / 2);
                    },
                    g: [3, 2]
                },
                {
                    x: 0,
                    y: 0,
                    id: 1
                },
                {
                    x: 1,
                    y: 0,
                    id: 2
                },
                {
                    x: 0,
                    y: 1,
                    id: 3
                },
                {
                    x: 1,
                    y: 1,
                    id: 4
                }
            ]
        };

        return layout[numPlayers].slice(0, numPlayers + 1);
    }

    app.showGame = showGame;
})(window.app = window.app || {});
