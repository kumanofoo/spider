import { useEffect } from "react";
import { getCardImage } from "./utils";
import { CompPile, Ranks } from "./spider";

type FoundationsProps = {
    cards: CompPile[],
    win: () => void,
}

function Foundations({cards, win}: FoundationsProps) {
    useEffect(() => {
        const foundations = document.getElementById('foundations');
        if (foundations == null) return;

        cards.forEach((card) => {
            if (card.pile < 0) return;

            // get destination
            const destPile: HTMLElement | null = (() => {
                for (let i = 0; i < foundations.children.length; i++) {
                    const pile = foundations.children[i] as HTMLElement;
                    const srcPileStr = pile.dataset?.from;
                    if (srcPileStr == undefined) continue;
                    const srcPile = parseInt(srcPileStr);
                    if (srcPile == card.pile) {
                        return pile;
                    }
                }
                return null;
            })();
            if (destPile == null) return;

            // get start position
            const pileElement = document.getElementsByClassName('pile')[card.pile];
            const bottomCard = pileElement.children[pileElement.children.length - 1] as HTMLElement;
            const movingFoundation = document.createElement('div');
            movingFoundation.classList.add('movingFoundation');
            movingFoundation.style.display = 'flex';
            movingFoundation.style.left = bottomCard.offsetLeft + "px";
            movingFoundation.style.top = bottomCard.offsetTop + "px";
            const table = document.getElementsByClassName('table')[0];
            table.appendChild(movingFoundation);
            
            // a top card in the pile
            const image = document.createElement("img");
            image.src = getCardImage({rank: 13, suit: card.card.suit, face: 'up'}).front;
            image.style.marginTop = "0";
            image.style.animation = "none";
            image.classList.add('card');
            movingFoundation.appendChild(image);
            // rests in the pile
            for (let rank = 12; rank >= 1; rank--) {
                const image = document.createElement("img");
                image.src = getCardImage({rank: rank as Ranks, suit: card.card.suit, face: 'up'}).front;
                image.classList.add('card');
                movingFoundation.appendChild(image);    
            }

            // set animation
            const anime = movingFoundation.animate([
                {
                    left: bottomCard.offsetLeft + "px",
                    top: bottomCard.offsetTop + "px",
                },
                {
                    left: destPile.offsetLeft + "px",
                    top: destPile.offsetTop + "px",
                }
            ], {
                duration: 500,
                delay: 200,
                fill: "forwards",
                easing: "ease",
            });
            anime.onfinish = () => {
                movingFoundation.remove();
                destPile.style.opacity = "1";
                win();
            };

            card.pile = -1;
        }, [cards]);
    });

    const foundations = cards.map((card, i) => {
        const card_img = getCardImage(card.card).front;
        if (i == 0) {
            return (
                <div data-from={card.pile} style={{marginLeft: "0", opacity: "0"}} key={i}>
                    <img src={card_img} className="card" />
                </div>
            );
        }
        else {
            return (
                <div data-from={card.pile} style={{marginLeft: "-5vw", opacity: "0"}} key={i} >
                    <img src={card_img} className="card"  />
                </div>
            );
        }
    });
    return <div id="foundations">{foundations}</div>;
}

export default Foundations;