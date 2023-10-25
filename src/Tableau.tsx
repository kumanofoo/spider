import { useEffect, useRef } from "react";
import { Card, isMovable } from "./spider";
import { MPile } from "./MovingPile";
import { getCardImage, Flip } from "./utils";


type TableauProps = {
    piles: {piles: Card[][], flip: Flip},
    onMovePile: (srcPile: {pile: number, row: number}, dstPile: number) => void,
    showMessage: boolean,
    onRestart: () => void,
}

function Tableau ({piles, onMovePile, showMessage, onRestart}: TableauProps) {
    const onSelect = (event: Event) => {
        event.preventDefault();
        const card = event.target as HTMLElement;
        if (card.dataset.col == undefined) return;
        const col = parseInt(card.dataset.col);
        if (Number.isNaN(col)) return;
        if (card.dataset.row == undefined) return;
        const row = parseInt(card.dataset.row);
        if (Number.isNaN(row)) return;

        const pileCard = card.parentElement?.parentElement;
        if (pileCard == null) return;
        if (pileCard.offsetLeft == undefined || pileCard.offsetTop == undefined) return;

        const src = piles.piles[col].slice(row);
        if (src == undefined || src.length == 0) return;
        if (!isMovable(src)) return;

        // hide selected cards
        const cards = pileCard.parentElement?.children;
        if (cards == null) return;
        for (let i = row; i < cards.length; i++) {
            (cards[i] as HTMLElement).style.visibility = "hidden";
        }

        // get pageX and pageY
        let pagex: number | null = null;
        let pagey: number | null = null;
        if (event.type == "touchstart") {
            pagex = (event as TouchEvent).touches[0].pageX;
            pagey = (event as TouchEvent).touches[0].pageY;
        }
        if (event.type == "mousedown") {
            pagex = (event as MouseEvent).pageX;
            pagey = (event as MouseEvent).pageY;
        }
        if (pagex == null || pagey == null) return;

        // initialize moving pile
        MPile.set(
            piles.piles[col].slice(row),
            {col: col, row: row},
            pileCard.offsetLeft,
            pileCard.offsetTop,
            pagex,
            pagey
        );
    }

    const onRelease = (event: Event) => {
        event.stopPropagation();
        // remove the moving pile
        const pile = MPile.remove();
        if (!pile?.src) return;

        // get pageX and pageY
        let pagex: number | null = null;
        let pagey: number | null = null;
        if (event.type == "touchend") {
            pagex = (event as TouchEvent).changedTouches[0].pageX;
            pagey = (event as TouchEvent).changedTouches[0].pageY;
        }
        if (event.type == "mouseup") {
            pagex = (event as MouseEvent).pageX;
            pagey = (event as MouseEvent).pageY;
        }
        let elements: Element[];
        if (pagex == null || pagey == null) {
            elements = [];
        }
        else {
            elements = document.elementsFromPoint(pagex, pagey);
        }

        // find a pile under pointer
        const piles = elements.map((element) => {
            if (!element.matches(".pile")) return null;
            const pile = (element as HTMLElement).dataset.pile;
            if (pile == undefined) return null;
            if (Number.isNaN(+pile)) return null;
            return parseInt(pile);
        }).filter((pile) => pile != null);

        let destinationPile: number;
        if (piles.length == 0 || piles[0] == null) {
            // return the moving pile to original position
            destinationPile = pile.src.col;
        }
        else {
            destinationPile = piles[0];
        }

        // move pile in tableau
        onMovePile({pile: pile.src.col, row: pile.src.row}, destinationPile);
    }

    useEffect(() => {
        const images = document.querySelectorAll("div.pile-card img, div.pile-flip-card img");
        for (const img of images) {
            img.addEventListener("touchstart", onSelect, {passive: false});
            img.addEventListener("mousedown", onSelect, {passive: false});
        }

       window.addEventListener("touchend", onRelease, {passive: false});
       window.addEventListener("mouseup", onRelease, {passive: false});

        return () => {
            const images = document.querySelectorAll("div.pile-card img, div.pile-flip-card img");
            for (const img of images) {
                img.removeEventListener("touchstart", onSelect);
                img.removeEventListener("mousedown", onSelect);
            }    

            window.removeEventListener("touchend", onRelease);   
            window.removeEventListener("mouseup", onRelease);   
        }
    }, [piles]);

    type CardProps = {
        cardImg: {front: string, back: string},
        col: number,
        row: number,
    }    
    const Card = (props: CardProps) => {
        let top = {};
        if (props.row == 0) {
            top = {marginTop: '0'};
        }
        return (
            <div className="pile-card" style={top} key={props.row}>
                <div className="pile-card-front" key={props.row}>
                    <img
                        src={props.cardImg.front}
                        className="card"
                        data-col={props.col}
                        data-row={props.row}
                    />
                </div>
            </div>
        );
    };
    
    type FlipCardProps = {
        cardImg: {front: string, back: string},
        col: number,
        row: number,
        from: string,
    }
    const FlipCard = (props: FlipCardProps) => {
        const elm = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (elm.current == null) return;
            if (!elm.current.classList.contains('stock')) return;
            elm.current.classList.remove('stock');
            const dstLeft = elm.current.offsetLeft;
            const dstTop = elm.current.offsetTop;

            const table = document.getElementsByClassName('table')[0];
            const stock = document.getElementById('stock');
            if (stock == null) return;
            const [srcLeft, srcTop] = (() => {
                if (stock.children.length == 1) {
                    // stock is empty
                    return [stock.offsetLeft, stock.offsetTop];
                }
                else {
                    const topStock = stock.children[stock.children.length - 1] as HTMLElement;
                    return [topStock.offsetLeft, topStock.offsetTop];        
                }
            })();
            const movingCard = document.createElement('img');
            movingCard.src = './cards/RED_BACK.svg';
            movingCard.style.position = "absolute";
            movingCard.style.left = srcLeft + "px";
            movingCard.style.top = srcTop + "px";
            const anime = movingCard.animate([
                {
                    left: srcLeft + "px",
                    top: srcTop + "px",
                },
                {
                    left: dstLeft + "px",
                    top: dstTop + "px",
                },
            ], {
                duration: 200,

            });
            anime.addEventListener("finish", () => {
                if (elm.current != null) {
                    elm.current.style.animation = 'animation-flip 0.3s ease 0.1s forwards';
                    elm.current.style.visibility = 'visible';
                }
                movingCard.remove();
            });
            movingCard.classList.add('card');
            table.appendChild(movingCard);
            
            return () => {};
        }, []);
        
        interface Style {
            marginTop?: string,
            animation?: string,
            visibility?: any,
        }
        let style: Style = {};
        if (props.row == 0) {
            style.marginTop = '0';
        }
        if (props.from == 'stock') {
            style.visibility = 'hidden';
        }
        else {
            style.animation = 'animation-flip 0.3s ease 0.1s forwards';
        }
        return (
            <div ref={elm} className={'pile-flip-card ' + props.from} style={style} key={props.row}>
                <div className="pile-flip-card-front">
                    <img
                        src={props.cardImg.front}
                        className="card flippable"
                        style={{marginTop: '0px'}}
                        data-col={props.col}
                        data-row={props.row}
                    />
                </div>
                <div className="pile-flip-card-back">
                    <img
                        src={props.cardImg.back}
                        className="card flippable"
                        style={{marginTop: '0px'}}
                        data-col={props.col}
                        data-row={props.row}
                    />
                </div>
            </div>
        );
    };

    const html_piles = piles.piles.map((pile, col) => {
        let cards = pile.map((card, row) => {
            const card_img = getCardImage(card);
            for (const c of piles.flip) {
                if (c.pile == col && c.row == row) {
                    return <FlipCard cardImg={card_img} col={col} row={row} from={c.from} />
                }
            }
            return <Card cardImg={card_img} col={col} row={row} />
        });
        if (cards.length == 0) {
            cards = [(() => {
                return (
                    <div className="no-card" key="empty">
                        <svg>
                            <rect
                                className="emptycard" x="0" y="0"
                            />
                        </svg>
                    </div>);
            })()];
        }
        return (<div
                className="pile"
                key={col}
                data-pile={col}
                >{cards}</div>);
    });

    return (
        <div className="tableau">
            {html_piles}
            {showMessage && 
                <div className="message" onClick={() => onRestart()}>
                    <div className="text">YOU WON!</div>
                </div>
            }
        </div>);
}


export default Tableau;

