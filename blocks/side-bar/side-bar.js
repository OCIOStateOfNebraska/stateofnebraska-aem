import { blocks } from './blocks-import.js'

function decorateBlock(block){ 
    const children = block.querySelectorAll('.side-bar >div >div')
    
    children.forEach(element => {        
        let className = element.classList[0]

        
        if(className.includes('-')){
            const arr = className.split('-')
            className = arr[0]
            for(let i = 1; i < arr.length; i++){
                arr[i] = arr[i].replace(arr[i][0],arr[i][0].toUpperCase())
                className += arr[i] 
            }
        }
        blocks[className](element);
        
        const arr = element.childNodes;
        arr.forEach(child =>{
            if(child.classList.contains('usa-card-group')){
                const cards = child.querySelectorAll( 'li' )
                
                cards.forEach(card =>{
                    const string = card.classList.value
                    
                    let newString = string.replace(/desktop:grid-col-\d+/g, 'desktop:grid-col-12');
                    newString = newString.replace(/tablet:grid-col-\d+/g, 'tablet:grid-col-12');

                    card.classList.value = newString;
                })
            }
        })
    });

}

export async function loadSideBar(block) {
    const resp = await fetch(`/side-bar.plain.html`);

    if (resp.ok) {
        block.innerHTML = await resp.text();    

        decorateBlock(block);      
        
      return block;
    }
  return null;
}

export default async function decorate(block) {
    await loadSideBar(block);

    }
    