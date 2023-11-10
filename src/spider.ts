export type Face = "up" | "down";
export type Suits = "Harts" | "Tiles" | "Clovers" | "Spades";
export type Ranks = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export interface Card {
    suit: Suits;
    rank: Ranks;
    face: Face;
}

export interface CompPile {
    card: Card,
    pile: number,
}

/**
 * Generate cards deck
 * @param n number of deck
 * @param suits list of suits
 * @param shuffle shuffle card list if set to true
 * @returns Card[] card list
 */
export function newCards(
    {n = 1, suits = ["Harts", "Tiles", "Clovers", "Spades"], shuffle = true}:
    {n?: number, suits?: Suits[], shuffle?: boolean}
): Card[] {
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
            // Debug with random
            //const j = Math.floor(random() * (i+1));
            const j = Math.floor(Math.random() * (i+1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
    }
    return cards;
}

/**
 * Check movability of the pile
 * @param pile list of Card
 * @returns The list is movable or not
 */
export const isMovable = (pile: Card[]): boolean => {
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

export interface Moving {
    cards: Card[],
    source: number,
}

export interface TableauItem {
    cards: Card[],
    piles: Card[][],
    foundations: Card[],
    moving: Moving,
}

/**
 * Create a Tableau object
 * @returns Tableau object
 */
export const newTableau = () => {
    let cards: Card[] = newCards({n: 4, suits: ['Harts', 'Spades'], shuffle: true});
    let piles: Card[][] = [];
    let foundations: Card[] = [];
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

    /**
     * Check if 13 cards in the pile is same suits and sequential
     * @param pile13 list of Card
     * @returns boolean it's true if the cards are same suits and sequential
     */
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

    /**
     * Initialize history
     */
    const startHistory = () => {
        history = [];
    }

    /**
     * Append current tableau in history
     */
    const pushHistory = () => {
        if (history == null) return;
        history.push(JSON.parse(JSON.stringify({piles: piles, cards: cards, foundations: foundations})));
    }

    /**
     * Retrieve a previous tableau from history 
     */
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
        foundations.splice(0);
        foundations.push(...h.foundations);
    };

    /**
     * Move the pile in 'moving' object
     * @param pile pile number(column) in tableau
     * @param row(card) in the pile
     * @returns it's true if the pile is movable
     */
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

    /**
     * Clean up 'moving' object
     * @returns 'moving' object before cleaning up
     */
    const cleanupMoving = (): {pile: number, row: number} | null => {
        if (moving.cards.length == 0) return null;
        const row = piles[moving.source].length;
        piles[moving.source].push(...moving.cards.splice(0));
        const pile = moving.source;
        moving.source = 0;
        return {pile, row};
    }
    
    /**
     * Append 'moving' object to the destination pile using movePile()
     * @param dst_pile destination pile
     * @returns CompPile[] list of complete pile
     */
    const putdownPile = (dst_pile: number | null): CompPile[] => {
        const src_pile = cleanupMoving();
        if (src_pile == null) return [];
        if (dst_pile == null) return [];
        if (dst_pile >= 0 && dst_pile < piles.length) {
            return movePile(src_pile, dst_pile);
        }
        return [];
    }
    
    /**
     * Move the src_pile to dst_pile and cleanup 'moving' object
     * @param src_pile source pile
     * @param dst_pile destination pile
     * @returns complete piles
     */
    const movePile = (src_pile: {pile: number, row: number}, dst_pile: number): CompPile[] => {
        cleanupMoving();
        if (src_pile.pile == dst_pile) return [];
        const src = piles[src_pile.pile].slice(src_pile.row);
        if (src == undefined || src.length == 0) return [];
        if (!isMovable(src)) return [];
        const dst_card = piles[dst_pile].slice(-1)[0];
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
                foundations.push(structuredClone(comp_pile.slice(-1)[0]));
                return [{card: comp_pile.slice(-1)[0], pile: dst_pile}];
            }
        }

        return [];
    }

    /**
     * Deal out a card from stock to each pile
     * @returns complete piles
     */
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
                    foundations.push(structuredClone(comp_pile.slice(-1)[0]));
                    complete_pile.push({card: comp_pile.slice(-1)[0], pile: i});
                }
            }
        })
        return complete_pile;
    }

    /**
     * Check if tableau is clean
     * @returns it's true if tableau has no cards
     */
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
        foundations: foundations,
        pickupPile: pickupPile,
        putdownPile: putdownPile,
        movePile: movePile,
        dealOut: dealOut,
        isTableauClean: isTableauClean,
        startHistory: startHistory,
        popHistory: popHistory,
    };
}
