type Face = "up" | "down";
type Suits = "Harts" | "Tiles" | "Clovers" | "Spades";
type Ranks = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export interface Card {
    suit: Suits;
    rank: Ranks;
    face: Face;
}

export interface CompPile {
    card: Card,
    pile: number,
}

const newRandom = (seed: number) => {
    let x = 123456789;
    let y = 362436069;
    let z = 521288629;
    let w = seed;

    return () => {
        let t = x ^ (x << 11);
        x = y;
        y = z;
        z = w;
        w = (w ^ (w >>> 19)) ^ (t ^ (t >>> 8));
        return (Math.abs(w) % 65536)/65536;
    }
}

const seed = 8;
console.log(`seed: ${seed}`);
const random = newRandom(seed);

export function newCards(
    {n = 1, suits = ["Harts", "Tiles", "Clovers", "Spades"], shuffle = true}:
    {n?: number, suits?: Suits[], shuffle?: boolean}
) {
    let cards: Card[] = [];
    let ranks: Ranks[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    // initialize cards
    for (let i = 0; i < n; i++) {
        for (let s of suits) {
            for (let r of ranks) {
                let c: Card = {suit: s, rank: r, face: "down"};
                cards.push(c);
            }
        }
    }

    // shuffle cards
    if (shuffle) {
        for (let i = cards.length - 1; i >= 1; i--) {
            const j = Math.floor(Math.random() * (i+1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
    }
    return cards;
}

export interface Moving {
    cards: Card[],
    source: number,
}

export interface TableauItem {
    cards: Card[],
    piles: Card[][],
    moving: Moving,
}

export const newTableau = () => {
    let cards: Card[] = newCards({n: 4, suits: ['Harts', 'Spades'], shuffle: true});
    let piles: Card[][] = [];
    let moving: Moving = {cards: [], source: 0};
    let history: TableauItem[] | null = null;
    for (let i = 0; i < 4; i++) {
        piles[i] = [];
        for (let n = 0; n < 5; n++) {
            const c = cards.shift();
            if (c) {
                piles[i].push(c);
            }
        }
    }
    for (let i = 4; i < 10; i++) {
        piles[i] = [];
        for (let n = 0; n < 4; n++) {
            const c = cards.shift();
            if (c) {
                piles[i].push(c);
            }
        }
    }

    const isMovable = (pile: Card[]): boolean => {
        let previous = pile[0];
        if (previous.face == "down") return false;

        for (const card of pile.slice(1)) {
            if (previous.suit != card.suit) {
                return false;
            }
            if (previous.rank - 1 != card.rank) {
                return false;
            }
            previous = card;
        }
        return true;
    }

    const completePile = (pile13: Card[]): boolean => {
        if (pile13.length != 13) return false;

        let n: number = 13;
        let suit = pile13[0].suit;
        for (const card of pile13) {
            if (card.face != "up" || card.rank != n || card.suit != suit) break;
            n--;
        }
        if (n == 0) return true;
        
        return false;
    }

    const startHistory = () => {
        history = [];
    }

    const pushHistory = () => {
        if (history == null) return;
        history.push(JSON.parse(JSON.stringify({piles: piles, cards: cards})));
    }

    const popHistory = () => {
        if (history == null) return;
        cleanupMoving();
        let h: TableauItem | undefined = history.pop()
        if (h == undefined) return;
        cards.splice(0);
        cards.push(...h.cards);
        piles.forEach((pile, index) => {
            pile.splice(0);
            if (h != undefined) pile.push(...h.piles[index]);
        });
    };

    const pickupPile = (pile: number, row: number): boolean => {
        cleanupMoving();
        const src = piles[pile].slice(row);
        if (src == undefined || src.length == 0) return false;
        if (!isMovable(src)) return false;
        moving.cards.push(...src);
        moving.cards = src;
        moving.source = pile;
        piles[pile].splice(row);
        return true;
    }

    const cleanupMoving = (): {pile: number, row: number} | null => {
        if (moving.cards.length == 0) return null;
        const row = piles[moving.source].length;
        piles[moving.source].push(...moving.cards.splice(0));
        const pile = moving.source;
        moving.source = 0;
        return {pile, row};
    }
    
    const putdownPile = (dst_pile: number | null): CompPile[] => {
        const src_pile = cleanupMoving();
        if (src_pile == null) return [];
        if (dst_pile == null) return [];
        if (dst_pile >= 0 && dst_pile < piles.length) {
            return movePile(src_pile, dst_pile);
        }
        return [];
    }
    
    const movePile = (src_pile: {pile: number, row: number}, dst_pile: number): CompPile[] => {
        cleanupMoving();
        const src = piles[src_pile.pile].slice(src_pile.row);
        if (src == undefined || src.length == 0) return [];
        const dst_card = piles[dst_pile].slice(-1)[0];
        if (!isMovable(src)) return [];
        if (dst_card == undefined || src[0].rank == dst_card.rank - 1) {
            pushHistory();
            const tmp_pile = piles[src_pile.pile].splice(src_pile.row);
            if (piles[src_pile.pile][src_pile.row - 1]) {
                piles[src_pile.pile][src_pile.row - 1].face = "up";
            }
            piles[dst_pile].push(...tmp_pile);
            if (completePile(piles[dst_pile].slice(-13))) {
                // remove completed pile
                const comp_pile = piles[dst_pile].splice(-13);

                // turn over bottom card
                const bottom_card = piles[dst_pile].slice(-1)[0];
                if (bottom_card) {
                    bottom_card.face = "up";
                }

                // record complete pile to return it
                console.log(`complete pile: ${{card: comp_pile.slice(-1)[0], pile: dst_pile}}`);
                return [{card: comp_pile.slice(-1)[0], pile: dst_pile}];
            }
        }

        return [];
    }

    const dealOut = (): CompPile[] => {
        cleanupMoving();
        if (cards.length == 0) return [];
        pushHistory();

        const complete_pile: CompPile[] = [];
        piles.forEach((p, i) => {
            const c = cards.shift();
            if (c) {
                c.face = "up";
                p.push(c);
                if (completePile(p.slice(-13))) {
                    // remove complete pile
                    const comp_pile = p.splice(-13);

                    // turn over bottom card
                    const bottom_card = p.slice(-1)[0];
                    if (bottom_card) {
                        bottom_card.face = "up";
                    }

                    // record complete pile to return it
                    complete_pile.push({card: comp_pile.slice(-1)[0], pile: i});
                }
            }
        })
        console.log(`dealOut: ${JSON.parse(JSON.stringify(complete_pile))}`);
        console.log(complete_pile);
        return complete_pile;
    }

    const isTableauClean = (): boolean => {
        cleanupMoving();
        if (cards.length != 0) return false;
        for (const p of piles) {
            if (p.length != 0) return false;
        }
        return true;
    }

    return {
        cards: cards,
        piles: piles,
        moving: moving,
        pickupPile: pickupPile,
        putdownPile: putdownPile,
        movePile: movePile,
        dealOut: dealOut,
        isTableauClean: isTableauClean,
        startHistory: startHistory,
        popHistory: popHistory,
    };
}


/*
const SpiderTest = () => {
    console.log("===== spider test =====");
    const tableau = newTableau();
    tableau.dealOut();
    console.log('pile[0]');
    console.log(tableau.piles[0]);
    console.log('> pickup pile[0][5]');
    tableau.pickupPile(0, 5)
    console.log('pile[0]');
    console.log(tableau.piles[0]);
    console.log(tableau.moving);
}

SpiderTest();
*/
