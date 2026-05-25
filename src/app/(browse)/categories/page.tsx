import { getCategories } from "@/domains/categories/queries/get-categories";
import { CategoryPill } from "@/shared/ui/category-pill";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = {
  title: "Categories",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <Container>
      <PageHeader
        title="Categories"
        description="Explore African creativity across disciplines."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryPill key={category.id} category={category} />
        ))}
      </div>
    </Container>
  );
}
