export default function (eleventyConfig) {
  // src/static is copied verbatim — never treated as templates
  eleventyConfig.ignores.add("src/static/**");
  eleventyConfig.addPassthroughCopy({ "src/static": "." });
  eleventyConfig.addPassthroughCopy("src/images");

  // ---------------------------------------------------------------
  // Library lookups.
  // Recipes store a slug like "ginger"; these turn that slug into the
  // real ingredient (name, photo) at build time. Update the photo once
  // in the library and every recipe using it changes.
  // ---------------------------------------------------------------
  const bySlug = (coll, slug) =>
    (coll || []).find((i) => i.fileSlug === slug || i.data.slug === slug);

  eleventyConfig.addFilter("bySlug", bySlug);

  // groups -> resolved groups + a count of how many have photos
  eleventyConfig.addFilter("resolveIngredients", function (groups, library) {
    let photos = 0;
    const out = (groups || []).map((g) => ({
      heading: g.heading || "",
      items: (g.items || []).map((it) => {
        const ing = bySlug(library, it.ingredient);
        const image = it.image || (ing && ing.data.image) || "";
        if (image) photos++;
        return {
          name: it.nameOverride || (ing && ing.data.title) || it.ingredient || "",
          qty: it.qty || "",
          note: it.note || "",
          image,
          link: it.link || (ing && ing.data.link) || ""
        };
      })
    }));
    return { groups: out, photos };
  });

  // product slugs -> full product records
  eleventyConfig.addFilter("resolveProducts", (slugs, library) =>
    (slugs || []).map((s) => bySlug(library, s)).filter(Boolean)
  );

  eleventyConfig.addFilter("whereGroup", (products, group) =>
    (products || []).filter((p) => p.data.group === group)
  );

  // search keywords for a recipe card, built automatically
  eleventyConfig.addFilter("searchBlob", function (recipe, library) {
    const d = recipe.data;
    const parts = [d.title, d.subtitle, d.cuisine, d.method, d.keywords];
    (d.ingredientGroups || []).forEach((g) =>
      (g.items || []).forEach((it) => {
        const ing = bySlug(library, it.ingredient);
        parts.push(it.nameOverride || (ing && ing.data.title) || it.ingredient);
      })
    );
    (d.tagList || []).forEach((t) => parts.push(t));
    return parts.filter(Boolean).join(" ").toLowerCase();
  });

  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric"
    })
  );

  eleventyConfig.addFilter("jsonEscape", (s) =>
    String(s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")
  );

  // the ingredient and product libraries are data, not pages
  eleventyConfig.addCollection("ingredients", (c) =>
    c.getFilteredByGlob("src/ingredients/*.md")
  );
  eleventyConfig.addCollection("products", (c) =>
    c.getFilteredByGlob("src/products/*.md")
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
