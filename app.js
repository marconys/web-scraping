const express = require("express");
const app = express();
const pup = require("puppeteer");

const port = 3000;
let count = 1;

app.get("/", async (req, res) => {
  const url = "https://www.mercadolivre.com.br/";
  const searchFor = "macbook";

  const produtos = [];

  // Estartar o navegador Chromium
  const browser = await pup.launch({ headless: false });
  //Criar uma nova página
  const page = await browser.newPage();
  console.log("Iniciei");

  //Redirecionar para a url
  await page.goto(url);
  console.log("fui para a url");

  //Aguardar o seletor '#cb1-edit' ser carregado
  await page.waitForSelector("#cb1-edit");

  //Escrever o nome do produto a ser buscado no input
  await page.type("#cb1-edit", searchFor);

  //Clicar no botão buscar
  await Promise.all([
    page.waitForNavigation(),
    await page.click(".nav-search-btn"),
  ]);

  //Executar o querySelectorAll dentro da página atual
  const links = await page.$$eval(".ui-search-item__group > a", (el) =>
    el.map((link) => link.href)
  );

  //Iterar com os links obtitos
  for (const link of links) {
    if (count === 10) continue;

    console.log("Página", count);
    await page.goto(link);

    const title = await page.$eval(".ui-pdp-title", (el) => el.innerHTML);
    const price = await page.$eval(
      ".andes-money-amount__fraction",
      (el) => el.innerHTML
    );

    const seller = await page.evaluate(() => {
      const el = document.querySelector("a > span.ui-pdp-color--BLUE");
      return el ? el.innerHTML : "Vendedor não informado!";
    });

    const obj = {};
    obj.title = title;
    obj.price = price;
    obj.seller = seller;
    obj.link = link;

    produtos.push(obj);

    count++;
  }

  //Atrasar o fechamento do navegador
  await new Promise((r) => setTimeout(r, 3000));
  //Fechar o navegador
  await browser.close();
  console.log("Fechei o navegador");

  // Criar a tabela HTML
  // const htmlTable = `
  //   <html>
  //     <head>
  //       <title>Resultados da Busca</title>
  //     </head>
  //     <body>
  //       <table border="1">
  //         <tr>
  //           <th>Título</th>
  //           <th>Preço</th>
  //           <th>Vendedor</th>
  //           <th>Link</th>
  //         </tr>
  //         ${produtos.map((produto) => `
  //           <tr>
  //             <td>${produto.title}</td>
  //             <td>${produto.price}</td>
  //             <td>${produto.seller}</td>
  //             <td><a href="${produto.link}" target="_blank">Link</a></td>
  //           </tr>`).join('')}
  //       </table>
  //     </body>
  //   </html>
  // `;
  //res.send(htmlTable);
  res.json(produtos);
});

app.listen(port, () => {
  console.log(`Server started on port ${port} 🏆`);
});
