import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
export type FilterOptionsState = {
  id: string;
  label: string;
};
// agar applied filter k andr ye item exixt krta hia toh iska mtlb checked hai
const filterOptions: FilterOptionsState[] = [
  { id: "burger", label: "Burger" },
  { id: "thali", label: "Thali" },
  { id: "biryani", label: "Biryani" },
  { id: "momos", label: "Momos" },
];

const FilterPage = () => {
  const appliedFilterHandler = (value: string) => {
    alert(value);
  };
  return (
    <div className="md:w-72">
      <div className="flex items-center justify-between">
        <h1 className="font-medium text-lg">Filter by cuisines</h1>
        <Button variant={"link"}>Reset</Button>
      </div>
      {filterOptions.map((option) => (
        <div key={option.id} className="flex items-center space-x-2 my-5">
          <Checkbox
            id={option.id}
            onClick={() => appliedFilterHandler(option.label)}
          />
        </div>
      ))}
    </div>
  );
};

export default FilterPage;