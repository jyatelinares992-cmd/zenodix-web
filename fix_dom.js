const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// Find all occurrences where a tier block ends abruptly before the next Category comment
// The pattern looks like:
//                                     <div class="tier-price">$X COP</div>
//                                 </div>
//                 </div>
//
//                 <!-- Category X: Name -->

// We replace it with proper closing tags:
const regex = /<div class=\"tier-price\">([^<]+)<\/div>\s*<\/div>\s*<\/div>\s*<!-- Category/g;

html = html.replace(regex, (match, price) => {
    return `<div class="tier-price">${price}</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Category`;
});

// For the last category before the end of app-panels:
// It might look like:
//                 <!-- Category 7: Power-Ups --> ...
//                 <!-- Category 8: Consultoría --> ...
// Wait, Category 7 ends with tier-price, but there's no Category comment after it because Category 8 is Consultoria... oh wait, Power-Ups is 7, Consultoría is 8.
// Let's just fix the tier-price abrupt endings that don't have following categories too.
const regex2 = /<div class=\"tier-price\">([^<]+)<\/div>\s*<\/div>\s*<\/div>\s*(<div id=\"panel-consultoria\")/g;
html = html.replace(regex2, (match, price, nextPanel) => {
    return `<div class="tier-price">${price}</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                ${nextPanel}`;
});

fs.writeFileSync('index.html', html);
console.log("HTML structure restored!");
