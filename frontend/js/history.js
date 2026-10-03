document.addEventListener("DOMContentLoaded", async function () {

    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
        window.location.href = "login.html";
        return;
    }

    try {
        const user = JSON.parse(userData);

        document.getElementById("userName").textContent =
            user.name || "User";

    } catch {
        document.getElementById("userName").textContent = "User";
    }


    document.getElementById("logoutBtn").addEventListener(
        "click",
        function () {

            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            localStorage.removeItem("lastGeneration");

            window.location.href = "login.html";
        }
    );


    const loading =
        document.getElementById("historyLoading");

    const error =
        document.getElementById("historyError");

    const errorMessage =
        document.getElementById("historyErrorMessage");

    const empty =
        document.getElementById("historyEmpty");

    const grid =
        document.getElementById("historyGrid");


    await loadHistory();


    async function loadHistory() {

        loading.hidden = false;
        error.hidden = true;
        empty.hidden = true;
        grid.hidden = true;

        try {

            const response = await fetch(
                "/history",
                {
                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Unable to load history."
                );
            }

            loading.hidden = true;


            if (!data.history ||
                data.history.length === 0) {

                empty.hidden = false;
                return;
            }


            grid.innerHTML = "";


            data.history.forEach(function (item) {

                const card =
                    document.createElement("article");

                card.className = "history-card";


                const image =
                    document.createElement("img");

                const imageUrl =
                    "/generated_images/" +
                    item.image_filename;

                image.src = imageUrl;
                image.alt = "Generated AI image";


                const details =
                    document.createElement("div");

                details.className =
                    "history-details";


                details.innerHTML = `
                    <h3>${escapeHtml(item.prompt)}</h3>

                    <p>
                        <strong>Style:</strong>
                        ${escapeHtml(item.rendering_style)}
                    </p>

                    <p>
                        <strong>Reference:</strong>
                        ${item.reference_strength}%
                    </p>

                    <p>
                        <strong>Resolution:</strong>
                        ${escapeHtml(item.resolution)}
                    </p>

                    <div class="history-evaluation">
                        <strong>Image Evaluation</strong>

                        <p>
                            Brightness:
                            ${formatValue(item.brightness)}
                        </p>

                        <p>
                            Contrast:
                            ${formatValue(item.contrast)}
                        </p>

                        <p>
                            Sharpness:
                            ${formatValue(item.sharpness)}
                        </p>

                        <p>
                            Quality:
                            ${escapeHtml(
                                item.quality || "N/A"
                            )}
                        </p>
                    </div>

                    <small>
                        ${formatDate(item.created_at)}
                    </small>
                `;


                const deleteButton =
                    document.createElement("button");

                deleteButton.className =
                    "delete-history-btn";

                deleteButton.textContent =
                    "Delete";

                deleteButton.addEventListener(
                    "click",
                    function () {
                        deleteHistory(item.id);
                    }
                );


                details.appendChild(deleteButton);

                card.appendChild(image);
                card.appendChild(details);

                grid.appendChild(card);

            });


            grid.hidden = false;

        } catch (err) {

            console.error(
                "History error:",
                err
            );

            loading.hidden = true;
            error.hidden = false;

            errorMessage.textContent =
                err.message ||
                "Unable to load generation history.";
        }
    }


    async function deleteHistory(historyId) {

        const confirmed =
            confirm(
                "Are you sure you want to delete this generation?"
            );

        if (!confirmed) {
            return;
        }


        try {

            const response = await fetch(
                `/history/${historyId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to delete history."
                );
            }


            await loadHistory();


        } catch (err) {

            alert(
                err.message ||
                "Unable to delete history."
            );
        }
    }


    function formatDate(dateString) {

        return new Date(
            dateString
        ).toLocaleString();

    }


    function formatValue(value) {

        if (value === null ||
            value === undefined) {

            return "N/A";
        }

        return Number(value).toFixed(2);
    }


    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent = value;

        return div.innerHTML;

    }

});