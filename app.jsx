const Pagination = ({ items, pageSize, onPageChange }) => {
  const { Button } = ReactBootstrap;
  if (items.length <= 1) return null;
  let num = Math.ceil(items.length / pageSize);
  let pages = range(1, num + 1);
  const list = pages.map((page) => {
    return (
      <Button key={page} onClick={onPageChange} className="page-item">
        {page}
      </Button>
    );
  });
  return (
    <nav>
      <ul className="pagination">{list}</ul>
    </nav>
  );
};

const range = (start, end) => {
  return Array(end - start + 1)
    .fill(0)
    .map((item, i) => start + i);
};

function paginate(items, pageNumber, pageSize) {
  const start = (pageNumber - 1) * pageSize;
  let page = items.slice(start, start + pageSize);
  return page;
}

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  useEffect(() => {
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

// App that gets data from Open Library
function App() {
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState("tolkien");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Add state for page size
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    "https://openlibrary.org/search.json?author=tolkien&sort=new",
    {
      docs: [],
    }
  );

  // Function to handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to the first page when page size changes
  };

  const handlePageChange = (e) => {
    setCurrentPage(Number(e.target.textContent));
  };

  let page = data.docs;

  // Check if there are enough hits to show pagination
  const shouldShowPagination = data.docs && data.docs.length > pageSize;

  if (page.length >= 1) {
    // Calculate the total number of pages based on the page size
    const totalPages = Math.ceil(page.length / pageSize);

    // Check if pagination should be shown
    if (shouldShowPagination) {
      page = paginate(page, currentPage, pageSize);
    }

    return (
      <Fragment>
        <form
          onSubmit={(event) => {
            doFetch(
              `https://openlibrary.org/search.json?author=${query}&sort=new`
            );
            event.preventDefault();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        {isError && <div>Something went wrong ...</div>}
        {isLoading ? (
          <div>Loading ...</div>
        ) : (
          <ul className="list-group">
            {page.map((item) => (
              <li key={item.key} className="list-group-item">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    `${item.title} ${item.author_name}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-light btn-block text-left" // Apply Bootstrap button classes
                  style={{ transition: "background-color 0.3s" }} // Add transition for hover effect
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        )}
        {/* Conditionally render Pagination based on shouldShowPagination */}
        {shouldShowPagination && (
          <Pagination
            items={data.docs}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          ></Pagination>
        )}
      </Fragment>
    );
  }
}

// ========================================
ReactDOM.render(<App />, document.getElementById("root"));
