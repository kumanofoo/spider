import { Card } from './spider'

/**
 * Get image file path from card information
 * @param c Card
 * @returns Image file path of card's front and back  
 */
export const getCardImage = (c: Card): {front: string, back: string} => {
    const suits_image = {
        'Harts': 'H',
        'Tiles': 'D',
        'Clovers': 'C',
        'Spades': 'S',
    }
    const rank_image = ['0', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    if (c.face == "down") {
        return {
            front: '/cards/RED_BACK.svg', 
            back: `/cards/${rank_image[c.rank]}${suits_image[c.suit]}.svg`,
        };
    }
    else {
        return {
            front: `/cards/${rank_image[c.rank]}${suits_image[c.suit]}.svg`,
            back: '/cards/RED_BACK.svg',
        };
    }
}

export type Flip = {
    pile: number,
    row: number,
    from: string,
}[];

/**
 * find faced up card
 * @returns index of faced up card
 */
export function flipedCard(piles: Card[][], previousPiles: Card[][]): Flip {
    const result: Flip = [];
    piles.forEach((cur_pile, p) => {
        if (p >= previousPiles.length) return;
        const pre_pile = previousPiles[p];
        cur_pile.forEach((cur_card, r) => {
            if (r >= pre_pile.length) return;
            if (cur_card.rank != pre_pile[r].rank) return;
            if (cur_card.suit != pre_pile[r].suit) return;
            if (cur_card.face == pre_pile[r].face) return;
            result.push({pile: p, row: r, from: ""});
        });
    })

    return result;
}

