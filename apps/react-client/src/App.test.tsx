import { render } from "@testing-library/react";
import { App } from "./App";

const ReactApp = () => <App />;

test("renders learn react link", () => {
	const { getByText } = render(<ReactApp />);
	const linkElement = getByText(/learn react/i);
	expect(linkElement).toBeInTheDocument();
});
