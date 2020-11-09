(function () {
    let keyWord = '+hanes';  // +box,+logo,-bear
    let categories = ["Jackets", "Coats", "Shirts", "Tops/Sweaters", "Sweatshirts", "Pants", "Shorts", "T-Shirts", "Hats", "Bags", "Accessories", "Shoes", "Skate"]
    // 0 -> "Jackets", 1 -> "Coats", 2-> "Shirts", 3 -> "Tops/Sweaters", 4 ->"Sweatshirts", 5->"Pants", 6->"Shorts", 7->"T-Shirts",
    //8-> "Hats", 9->"Bags", 10->"Accessories", 11->"Shoes", 12->"Skate"
    let category = categories[10];
    let preferredSize = 'Medium';  
    let preferColor = 'black'; 
    let autoCheckout = true;  
    let checkout_delay = 2500; 

    //Address info
    let billing_name = "Shamel Sameer";
    let order_email = "sameershamel@gmail.com";
    let order_tel = "----------";
    let order_address = "---------";
    let order_billing_address_2 = "---";
    let order_billing_zip = "--";
    let order_billing_city = "--";
    let order_billing_state = "--";  
    let order_billing_country = "--"; 

    //Payment info
    let credit_card_type = "visa"; 
 
    let cnb = "4111 1111 1111 1111";
    let month = "10";
    let year = "2022";
    let vval = "119";

    //=======================================================================================================

    let startTime = null;
    let respondJSON = null;
    let isNew = true;
    let item_selected = false;

    let mobile_stock_api = "https://www.supremenewyork.com/mobile_stock.json";
    let event = document.createEvent('Event');
    event.initEvent('change', true, true); 

    let notifyHeader = document.createElement('p');
    notifyHeader.style.cssText = "padding-left:120px;margin: auto;width: 100%;background-color: #99cc00;";
    let refresh_count = 0;
    document.getElementsByTagName('header')[0].appendChild(notifyHeader);

    let retryFetch = async (url, options=null, retry=0) => {
        if (retry >= 4) return Promise.resolve(1);
        let res = await fetch(url, options);
        if (res.status !== 200) {
            await sleep(Math.min(retry * 500, 2 * 1000));
            return await retryFetch(url, options, retry + 1);
        } else {
            return await res.json();
        }
    };

    function matchKeyWord (itemName, keyWords) {
        let name = itemName.toLowerCase().trim();
        let keyWordsList = keyWords.toLowerCase().split(",");
        for (let i = 0; i < keyWordsList.length; i ++) {
            let word = keyWordsList[i].trim();
            if ((word.includes('+') && !name.includes(word.substr(1))) ||
                (word.includes('-') && name.includes(word.substr(1)))) {
                return false;
            }
        }
        return true;
    };

    let sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    async function mobileAPIRefreshed(respond) {
        if (respond['products_and_categories'] == null || respond['products_and_categories']['new'] == null) {
            return false;
        }
        let newProducts = respond['products_and_categories']['new'];
        for (let index = 0; index < newProducts.length; index ++) {
            let item =newProducts[index];
            if (item != null && item['name'] != null && matchKeyWord(item['name'], keyWord)) {
                isNew = true;
                return true;
            }
        }

        let categoryProduct = respond['products_and_categories'][category];
        if (categoryProduct != undefined) {
            for (let index = 0; index < categoryProduct.length; index ++) {
                let item =categoryProduct[index];
                if (item != null && item['name'] != null && matchKeyWord(item['name'], keyWord)) {
                    isNew = false;
                    return true;
                }
            }
        }
        return false;
    }

    async function monitor() {
        if (!item_selected) {
            notifyHeader.innerHTML = 'time to cook： ' + refresh_count;
            refresh_count ++;
            let refreshed = false;
                
            let respond = await retryFetch(mobile_stock_api);
            refreshed = respond == null ? false : await mobileAPIRefreshed(respond);
            if (refreshed) {
                respondJSON = respond;
                startTime = new Date();
                console.log("Detect Page refreshed with mobile endpoint at: " + startTime.toISOString());
                notifyHeader.innerHTML = "Starting Script..."
                window.location.href = isNew? 'https://www.supremenewyork.com/mobile/#categories/new' : ('https://www.supremenewyork.com/mobile/#categories/' + category);
                await sleep(300);
                start();
                return;
            } else {
                console.log("Not refreshed, retrying ...")
                await sleep(1000);
                await monitor();
                return;
            }
        }
    }


    let start = () => {
        console.log("start!!");
        let items = document.getElementsByClassName("name");
        let selectedItem = null;
        if (items.length > 0) {
            notifyHeader.innerHTML = "Finding Item...";
            for (item of items) {
                let name = item.innerHTML;

                if (matchKeyWord(name, keyWord)) {
                    startTime = new Date().getTime();
                    selectedItem =item;
                    selectedItem.click();
                    break;
                }
            }

            if (selectedItem !== null) {
                (function waitTillItemClick() {
                    items = document.getElementsByClassName("name");
                    if (items.length > 0) {
                        console.log('wait item click ...');
                        selectedItem.click();
                        setTimeout(function(){ waitTillItemClick(); }, 150);
                    } else {
                        return;
                    }
                })();
            } else {
                sleep(50).then(start);
            }
        } else {
            sleep(150).then(start);
        }
    }

    (function waitTillArticlePageIsOpen() {
        console.log('wait item page ...');
        let atcBtn = document.getElementsByClassName("cart-button")[0];
        if (atcBtn) {
            addToCart();
        } else {
            setTimeout(function(){ waitTillArticlePageIsOpen(); }, 150);
        }
        return;
    })();



    async function addToCart(){
        if (document.getElementById('cart-update').children[0].innerHTML === "remove") {
            checkout();
            return;
        }
        notifyHeader.innerHTML = "Starting...";
        await chooseColor();
        notifyHeader.innerHTML = "Carting...";
        await sleep(70);
        notifyHeader.innerHTML = "Carting...";
        await chooseSize();
        notifyHeader.innerHTML = "Carting...";
        await sleep(70);
        let atcBtn = document.getElementsByClassName("cart-button")[0];
        atcBtn.click();
        item_selected = true;
        
        (function waitTillCartUpdates() {
            let cart = document.getElementById("goto-cart-link").innerHTML;
            if (cart == '' || cart == 0) {
                setTimeout(function(){ waitTillCartUpdates(); }, 150);
                return;
            } else {
                // Click checkout button
                notifyHeader.innerHTML = "Checkout";
                checkout()
                return;
            }
        })();
    }


    async function chooseColor() {
        let image;
        let url = "/shop/"+window.location.hash.split("/")[1]+".json";
        let res = await fetch(url);
        let myJson = await res.json();
        for (item of myJson.styles){
            let color = item.name;
            if (checkAvaliability(item.sizes)) {
                let id = item.id;
                let imageID = "style-"+id;
                image = document.getElementById(imageID).getElementsByClassName("style-thumb")[0]; 
                if (color.toLowerCase().includes(preferColor.toLowerCase()) || preferColor.toLowerCase() === 'any') {
                    image.click();
                    break;
                }
            }
        }
        if (image !== undefined) {
            image.click();
        }
    }

    function checkAvaliability(sizes) {
        for (size of sizes) {
            if (size['stock_level'] > 0) {
                return true;
            }
        }
        return false;
    }

    function chooseSize(){
        let sizeOpts = document.getElementsByTagName("option");
        let sizeVal = sizeOpts[0].value
        for (let option of sizeOpts){
            let size = option.text.toLowerCase();
            if (size === preferredSize.toLowerCase() || size === 'N/A'){
                sizeVal =  option.value;
                break;
            }
        }
        sizeOpts = document.getElementsByTagName("select")[0].value = sizeVal;

    }

    function checkout(){
        window.location.href = 'https://www.supremenewyork.com/mobile/#checkout';
        let checkoutBtn = document.getElementById("submit_button");
        waitTillCheckoutPageIsOpen();
    }

    async function waitTillCheckoutPageIsOpen() {

        checkoutBtn = document.getElementById("submit_button");
        if (checkoutBtn) {
            notifyHeader.innerHTML = "Filling Info...";
            await sleep(50);
            document.getElementById("order_billing_name").focus();
            document.getElementById("order_billing_name").value = billing_name;

            await sleep(50);
            document.getElementById("order_email").focus();
            document.getElementById("order_email").value = order_email;
            await sleep(50);
            document.getElementById("order_tel").focus();
            document.getElementById("order_tel").value = order_tel;
            await sleep(50);
            document.getElementById("order_billing_address").focus();
            document.getElementById("order_billing_address").value = order_address;

            if (document.getElementById("order_billing_address_2")) {
                await sleep(50);
                document.getElementById("order_billing_address_2").focus();
                document.getElementById("order_billing_address_2").value = order_billing_address_2;
            }
        

            if (document.getElementById("obz")) {
                await sleep(50);
                document.getElementById("obz").focus();
                document.getElementById("obz").value = order_billing_zip;
            }
            if (document.getElementById("order_billing_zip")) {
                await sleep(50);
                document.getElementById("order_billing_zip").focus();
                document.getElementById("order_billing_zip").value = order_billing_zip;
            }
            await sleep(50);

            document.getElementById("order_billing_city").focus();
            document.getElementById("order_billing_city").value = order_billing_city;

            if (document.getElementById("order_billing_country")) {
                await sleep(50);
                document.getElementById("order_billing_country").value = order_billing_country;
                document.getElementById("order_billing_country").dispatchEvent(event);
            }

            if (document.getElementById("order_billing_state")) {
                await sleep(50);
                document.getElementById("order_billing_state").focus();
                document.getElementById("order_billing_state").value = order_billing_state;
                document.getElementById("order_billing_state").dispatchEvent(event);
            }
        
            if (document.getElementById("credit_card_type")) {
                await sleep(50);
                document.getElementById("credit_card_type").value = credit_card_type;
                document.getElementById("credit_card_type").dispatchEvent(event);
            }
            if (document.getElementById("credit_card_n")) {
                await sleep(50);
                document.getElementById("credit_card_n").focus();
                document.getElementById("credit_card_n").value = cnb;
            }
            if (document.getElementById("credit_card_month")) {
                await sleep(50);
                document.getElementById("credit_card_month").focus();
                document.getElementById("credit_card_month").value = month;
                document.getElementById("credit_card_month").dispatchEvent(event);
            }
            if (document.getElementById("credit_card_year")) {
                await sleep(50);
                document.getElementById("credit_card_year").focus();
                document.getElementById("credit_card_year").value = year;
                document.getElementById("credit_card_year").dispatchEvent(event);
            }
            if (document.getElementById("cav")) {
                await sleep(50);
                document.getElementById("cav").focus();
                document.getElementById("cav").value = vval;
            }
            if (document.getElementById("credit_card_cvv")) {
                await sleep(50);
                document.getElementById("credit_card_cvv").focus();
                document.getElementById("credit_card_cvv").value = vval;
            }

            await sleep(50);      
            document.getElementById("order_terms").click();

            notifyHeader.innerHTML = "Autofilling Info...";
            if (autoCheckout){
                notifyHeader.innerHTML = "Checking out...";
                await sleep(checkout_delay);
                document.getElementById("hidden_cursor_capture").click();
            }
            console.log('paymentTime: ' + (new Date().getTime() - startTime) + ' ms');
            notifyHeader.remove();
            return;
        } else {
            setTimeout(async function(){ await waitTillCheckoutPageIsOpen(); }, 200);
            console.log("waiting to Chekcout...");
        }
    }

    monitor()
})()

completion()
