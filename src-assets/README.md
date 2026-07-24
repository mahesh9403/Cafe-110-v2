# Source assets

Original artwork the served files in `img/` were derived from. Nothing here is
loaded by the website — these exist so the served versions can be regenerated.

## Logo

| File | Detail |
|---|---|
| `oneten-white-logo-master.png` | 6250x6250 master. `img/logo/oneten-white-logo.png` (800x254) and `.webp` are cropped from this. |

## Signature dish photography

Served as WebP in `img/dishes/`; shown on the home page Signature Dishes section.

| File | Dish | Served as |
|---|---|---|
| `assorted-bread-basket.jpeg` | Assorted fresh bread served with Lemon mustard butter, Buldak Butter, Charred Corn Dip and Spinach & Artichoke Dip | `img/dishes/assorted-bread-basket-cafe-oneten.webp` |
| `belgian-slice.jpeg` | Moist chocolate cake layers with creamy chocolate mousse with a hot chocolate ganache drizzle | `img/dishes/belgian-slice-cafe-oneten.webp` |
| `deconstructed-tiramisu.jpeg` | Savoiardi biscuits soaked in espresso with dollops of whipped mascarpone dusted with cocoa | `img/dishes/deconstructed-tiramisu-cafe-oneten.webp` |
| `fruit-cake-slice.jpeg` | A moist, golden sponge cake filled with fresh fruits. Finished with a light vanilla cream frosting | `img/dishes/fruit-cake-slice-cafe-oneten.webp` |
| `peri-peri-paneer-rice-bowl.jpeg` | Fragrant brown rice with fresh grated coconut and spicy bean gravy topped with assorted veg stir fry and Peri Peri Paneer | `img/dishes/peri-peri-paneer-rice-bowl-cafe-oneten.webp` |

## Not stored here

`OneTen Menu.pdf` (41 MB) is gitignored. Its master lives in Canva as
"OneTen Menu July" — re-export from there rather than committing it. The menu
viewer images in `img/menu-pages/` were produced from it at 150 DPI:

```
pdftoppm -r 150 -f N -l N -png -singlefile 'OneTen Menu.pdf' out
# then: PIL save as WEBP, quality=82, method=6  ->  1241x1755
```
