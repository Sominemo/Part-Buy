import 'core-js/es/promise'
import 'core-js/es/array'
import "regenerator-runtime/runtime";
import 'whatwg-fetch'

const statuses = {
    NONE: 0b00,
    ONLINE: 0b01,
    SHIPPING: 0b10,
}

function convert(data) {
    return {
        title: data.title || null,
        image: data.logo_url || null,
        info: data.note || null,
        status: (data.is_partially_online ? statuses.ONLINE : 0) + (data.is_full_online ? statuses.SHIPPING : 0),
        url: data.url || null,
        tags: data.categories,
    }
}

async function fill(category = null) {
    const main = document.getElementsByTagName("main")[0]
    try {
        if (category === null && window.location.hash !== "") window.location.hash = ""
        if (category !== null && window.location.hash != `#${category}`) window.location.hash = `#${category}`


        main.innerHTML = ""

        const loader = document.createElement("div")
        loader.classList.add("loader")
        loader.innerText = "Завантаження..."
        main.appendChild(loader)


        const r = await window.fetch("https://goose.ml/api/credit/divided-payment/partners"
            + (category === null ? "" : `?categories=${encodeURIComponent(category)}`));
        const list = await r.json()

        function makeCard({ title = "", image = null, info = null, status = statuses.NONE, url = null, tags = []} = {}) {
            const card = document.createElement("div");
            card.classList.add("card");

            let shown = null

            function listItem(icon, data, click = () => { }) {
                const list = document.createElement("div");
                list.classList.add("list");

                const left = document.createElement("div");
                left.classList.add("left");
                list.appendChild(left);

                const img = document.createElement("img");
                img.src = `assets/${icon}.svg`;
                left.appendChild(img);

                const right = document.createElement("div");
                right.classList.add("right");
                right.appendChild(data instanceof Element ? data : document.createTextNode(data));
                list.appendChild(right);

                list.addEventListener("click", click)

                return list;
            }

            function showInfo() {
                const data = document.createElement("div");
                data.classList.add("content");
                card.appendChild(data);

                if (info !== null) {
                    data.appendChild(listItem("info", info, (ev) => {
                        ev.stopPropagation()
                    }));
                }

                if (url !== null) {
                    data.appendChild(listItem("link", url, (ev) => {
                        ev.stopPropagation()
                        window.open(url, "_blank")
                    }));
                }

                if (status & statuses.SHIPPING) {
                    data.appendChild(listItem("shipping", "З доставкою", (ev) => {
                        ev.stopPropagation()
                        alert("Цей індикатор означає, що при покупці частинами"
                            + " партнер надає можливість оформити замовлення онлайн з доставкою")
                    }));
                } else if (status & statuses.ONLINE) {
                    data.appendChild(listItem("online", "Замовлення онлайн", (ev) => {
                        ev.stopPropagation()
                        alert("Цей індикатор означає, що при покупці частинами"
                            + " партнер надає можливість оформити замовлення онлайн, але потрібно відвідувати магазин")
                    }))
                }

                if (tags.length > 0) {
                    data.appendChild(listItem("label", tags.map(e => e.title).join("; "), (ev) => {
                        ev.stopPropagation()
                    }));
                }

                return data;
            }

            function toggle(params) {
                if (shown === null) shown = showInfo();
                else {
                    card.removeChild(shown);
                    shown = null;
                }
            }

            card.addEventListener("click", toggle);

            const head = document.createElement("div");
            head.classList.add("head");
            card.appendChild(head);

            const name = document.createElement("div");
            name.classList.add("name");
            head.appendChild(name);

            const icons = document.createElement("div");
            icons.classList.add("icons");
            head.appendChild(icons);

            if (info !== null) {
                const infoIcon = document.createElement("img");
                infoIcon.src = "assets/info.svg";
                icons.appendChild(infoIcon);
            }

            if (status & statuses.SHIPPING) {
                const shipIcon = document.createElement("img");
                shipIcon.src = "assets/shipping.svg";
                icons.appendChild(shipIcon);
            } else if (status & statuses.ONLINE) {
                const onlineIcon = document.createElement("img");
                onlineIcon.src = "assets/online.svg";
                icons.appendChild(onlineIcon);
            }

            const logo = document.createElement("div");
            logo.classList.add("logo");
            name.appendChild(logo);

            const placeholder = document.createElement("div");
            placeholder.classList.add("placeholder");
            placeholder.innerText = title.substring(0, 1);
            logo.appendChild(placeholder);

            if (image !== null) {
                const img = document.createElement("img");
                img.addEventListener("load", () => { img.style.opacity = 1 })
                img.src = image;
                logo.appendChild(img);
            }

            const nameText = document.createElement("div");
            nameText.classList.add("name-text");
            nameText.innerText = title
            name.appendChild(nameText);

            return card
        }

        main.innerHTML = ""

        list.forEach(e => {
            main.appendChild(makeCard(convert(e)))
        })

        if (list.length === 0) {
            const loader = document.createElement("div")
            loader.classList.add("loader")
            loader.innerText = "Порожньо"
            main.appendChild(loader)
        }
    } catch (e) {
        const loader = document.createElement("div")
        loader.classList.add("loader")
        loader.innerText = "Помилка"
        main.appendChild(loader)
    }
}

let categoriesLoaded = false

window.addEventListener("load", async () => {
    document.body.style.opacity = 1
    if (typeof window.webkitConvertPointFromNodeToPage !== 'function' || !(/(MSIE|Trident\/|Edge\/)/i.test(navigator.userAgent))) {
        const promo = document.createElement("div")
        promo.className = "nav-item red"
        promo.innerHTML = `Спробуйте Mono PWA <span style="opacity: .5;">(beta)</span>`
        promo.addEventListener("click", () => { window.open("https://mono.sominemo.com", "_blank") })
        document.getElementById("filters").appendChild(promo)
    }
    document.getElementById("filter-button").addEventListener("click", async () => {
        document.getElementById("filters").classList.add("shown");
        if (!categoriesLoaded) {
            const c = document.getElementById("categories")
            const r = await window.fetch("https://goose.ml/api/credit/divided-payment/categories");
            const list = await r.json()

            c.innerHTML = "";

            const current = window.location.hash.substring(1)

            {
                const el = document.createElement("div")
                el.classList.add("nav-item")
                el.innerText = "Усі"
                if (current === "") el.classList.add("active")
                el.addEventListener("click", () => {
                    Array.from(document.getElementsByClassName("nav-item")).forEach(e => e.classList.remove("active"))
                    el.classList.add("active")
                    fill()
                    document.getElementById("closer").click()
                })
                c.appendChild(el)
            }

            list.forEach(e => {
                const el = document.createElement("div")
                el.classList.add("nav-item")
                if (e.id === current) el.classList.add("active")
                el.innerText = e.title
                el.addEventListener("click", () => {
                    Array.from(document.getElementsByClassName("nav-item")).forEach(e => e.classList.remove("active"))
                    el.classList.add("active")
                    fill(e.id)
                    document.getElementById("closer").click()
                })
                c.appendChild(el)
            })

            categoriesLoaded = true
        }
    })

    document.getElementById("closer").addEventListener("click", () => {
        document.getElementById("filters").classList.remove("shown");
    })


    fill((window.location.hash === "" ? null : window.location.hash.substring(1)))
})

window.addEventListener("hashchange", () => {
    fill((window.location.hash === "" ? null : window.location.hash.substring(1)))
})